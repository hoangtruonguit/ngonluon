import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserId(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  async findHistoryByUserId(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    userId: string;
    planName: string;
    startDate: Date;
    endDate: Date;
    status?: SubscriptionStatus;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
  }) {
    return this.prisma.subscription.create({ data });
  }

  async update(
    id: string,
    data: {
      planName?: string;
      endDate?: Date;
      status?: SubscriptionStatus;
      stripePriceId?: string;
      cancelledAt?: Date | null;
    },
  ) {
    return this.prisma.subscription.update({ where: { id }, data });
  }

  async findExpiredActive() {
    return this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: new Date() },
      },
      include: { user: { select: { email: true, fullName: true } } },
    });
  }

  async findUserStripeCustomerId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, fullName: true },
    });
    return user;
  }

  async setUserStripeCustomerId(userId: string, stripeCustomerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }
}
