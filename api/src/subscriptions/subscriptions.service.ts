import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsRepository } from './subscriptions.repository';
import { RedisService } from '../redis/redis.service';
import { MailProducer } from '../mail/mail.producer';
import { Plan } from './interfaces/subscription.interfaces';

const CACHE_PREFIX = 'sub:';
const CACHE_TTL = 300; // 5 minutes
const IDEMPOTENCY_PREFIX = 'stripe-event:';
const IDEMPOTENCY_TTL = 86400; // 24 hours

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly stripe: Stripe;
  private readonly plans: Plan[];

  constructor(
    private readonly repository: SubscriptionsRepository,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailProducer: MailProducer,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey || 'sk_test_dummy_key');

    this.plans = [
      {
        name: 'Basic',
        price: 4.99,
        currency: 'usd',
        interval: 'month',
        stripePriceId:
          this.configService.get<string>('STRIPE_PRICE_BASIC') || '',
        features: ['HD quality', 'No ads', 'All movies', '2 devices'],
      },
      {
        name: 'Premium',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        stripePriceId:
          this.configService.get<string>('STRIPE_PRICE_PREMIUM') || '',
        features: [
          '4K quality',
          'No ads',
          'All movies',
          'Download offline',
          '4 devices',
        ],
      },
    ];
  }

  getPlans(): Plan[] {
    return this.plans;
  }

  async createCheckoutSession(userId: string, planName: string) {
    const plan = this.plans.find((p) => p.name === planName);
    if (!plan) throw new BadRequestException(`Invalid plan: ${planName}`);

    if (!plan.stripePriceId) {
      throw new BadRequestException(
        `Stripe price ID for plan "${planName}" is not configured. Set STRIPE_PRICE_${planName.toUpperCase()} in your environment variables.`,
      );
    }

    // Check if user already has an active subscription
    const existing = await this.repository.findActiveByUserId(userId);
    if (existing) {
      throw new BadRequestException('You already have an active subscription');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/pricing?success=true`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/pricing?cancelled=true`,
      metadata: { userId, planName },
    });

    return { url: session.url };
  }

  async getMySubscription(userId: string) {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached) as Record<string, unknown>;

    const sub = await this.repository.findActiveByUserId(userId);
    if (sub) {
      await this.redisService.set(cacheKey, JSON.stringify(sub), CACHE_TTL);
    }
    return sub;
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.getMySubscription(userId);
    return !!sub;
  }

  async getSubscriptionHistory(userId: string) {
    return this.repository.findHistoryByUserId(userId);
  }

  async cancelSubscription(userId: string) {
    const sub = await this.repository.findActiveByUserId(userId);
    if (!sub) throw new NotFoundException('No active subscription found');

    if (sub.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await this.repository.update(sub.id, { cancelledAt: new Date() });
    await this.invalidateCache(userId);

    return {
      message: 'Subscription will be cancelled at end of billing period',
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret || '',
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Idempotency check
    const idempotencyKey = `${IDEMPOTENCY_PREFIX}${event.id}`;
    const processed = await this.redisService.get(idempotencyKey);
    if (processed) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        this.handlePaymentFailed(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    await this.redisService.set(idempotencyKey, '1', IDEMPOTENCY_TTL);
  }

  // --- Admin: Grant complimentary subscription ---
  async grantComplimentary(userId: string, durationDays = 30) {
    const existing = await this.repository.findActiveByUserId(userId);
    if (existing) {
      throw new BadRequestException('User already has an active subscription');
    }

    const now = new Date();
    const endDate = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    const sub = await this.repository.create({
      userId,
      planName: 'Complimentary',
      startDate: now,
      endDate,
    });

    await this.invalidateCache(userId);
    return sub;
  }

  // --- Cron: expire subscriptions ---
  async expireOverdueSubscriptions() {
    const expired = await this.repository.findExpiredActive();
    this.logger.log(`Found ${expired.length} expired subscriptions to process`);

    for (const sub of expired) {
      await this.repository.update(sub.id, { status: 'EXPIRED' });
      await this.invalidateCache(sub.userId);

      if (sub.user.email) {
        await this.mailProducer.sendSubscriptionEmail(
          sub.user.email,
          sub.user.fullName || 'User',
          sub.planName,
          sub.endDate.toISOString(),
        );
      }
    }
  }

  // --- Private helpers ---
  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const userData = await this.repository.findUserStripeCustomerId(userId);
    if (!userData) throw new NotFoundException('User not found');

    if (userData.stripeCustomerId) return userData.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: userData.email,
      name: userData.fullName || undefined,
      metadata: { userId },
    });

    await this.repository.setUserStripeCustomerId(userId, customer.id);
    return customer.id;
  }

  private getSubscriptionPeriod(subscription: Stripe.Subscription) {
    const item = subscription.items.data[0];
    return {
      start: new Date(item.current_period_start * 1000),
      end: new Date(item.current_period_end * 1000),
    };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planName = session.metadata?.planName;
    if (!userId || !planName) return;

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const period = this.getSubscriptionPeriod(stripeSubscription);

    const sub = await this.repository.create({
      userId,
      planName,
      startDate: period.start,
      endDate: period.end,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
    });

    await this.invalidateCache(userId);

    const userData = await this.repository.findUserStripeCustomerId(userId);
    if (userData?.email) {
      await this.mailProducer.sendSubscriptionEmail(
        userData.email,
        userData.fullName || 'User',
        planName,
        sub.endDate.toISOString(),
      );
    }

    this.logger.log(`Subscription created for user ${userId}: ${planName}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subDetails = invoice.parent?.subscription_details;
    const stripeSubId = subDetails?.subscription as string | undefined;
    if (!stripeSubId) return;

    const sub = await this.repository.findByStripeSubscriptionId(stripeSubId);
    if (!sub) return;

    const stripeSubscription =
      await this.stripe.subscriptions.retrieve(stripeSubId);
    const period = this.getSubscriptionPeriod(stripeSubscription);
    await this.repository.update(sub.id, {
      endDate: period.end,
      status: 'ACTIVE',
    });
    await this.invalidateCache(sub.userId);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = await this.repository.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!sub) return;

    const period = this.getSubscriptionPeriod(subscription);
    const updates: Parameters<typeof this.repository.update>[1] = {
      endDate: period.end,
      cancelledAt: subscription.cancel_at_period_end ? new Date() : null,
    };

    const newPriceId = subscription.items.data[0]?.price.id;
    if (newPriceId && newPriceId !== sub.stripePriceId) {
      const plan = this.plans.find((p) => p.stripePriceId === newPriceId);
      if (plan) updates.planName = plan.name;
      updates.stripePriceId = newPriceId;
    }

    await this.repository.update(sub.id, updates);
    await this.invalidateCache(sub.userId);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const sub = await this.repository.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!sub) return;

    await this.repository.update(sub.id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });
    await this.invalidateCache(sub.userId);

    const userData = await this.repository.findUserStripeCustomerId(sub.userId);
    if (userData?.email) {
      await this.mailProducer.sendSubscriptionEmail(
        userData.email,
        userData.fullName || 'User',
        sub.planName,
        sub.endDate.toISOString(),
      );
    }

    this.logger.log(`Subscription cancelled for user ${sub.userId}`);
  }

  private handlePaymentFailed(invoice: Stripe.Invoice) {
    const sub = invoice.parent?.subscription_details?.subscription;
    const subId = typeof sub === 'string' ? sub : (sub?.id ?? 'unknown');
    this.logger.warn(
      `Payment failed for invoice ${invoice.id}, subscription ${subId}`,
    );
  }

  private async invalidateCache(userId: string) {
    await this.redisService.del(`${CACHE_PREFIX}${userId}`);
  }
}
