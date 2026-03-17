// rabbitmq/rabbitmq.service.ts
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

// ─── Constants ─────────────────────────────────────
export const EXCHANGES = {
  MAIN: 'app.exchange',
  RETRY: 'app.retry.exchange',
  DLQ: 'app.dlq.exchange',
} as const;

export const QUEUES = {
  EMAIL: 'email.queue',
  EMAIL_RETRY: 'email.retry.queue',
  EMAIL_DLQ: 'email.dlq',
} as const;

export const ROUTING_KEYS = {
  EMAIL_WELCOME: 'email.welcome',
  EMAIL_RESET_PASSWORD: 'email.reset_password',
  EMAIL_SUBSCRIPTION: 'email.subscription',
  EMAIL_ALL: 'email.*',
} as const;

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 60s (progressive delay)

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private channelWrapper: ChannelWrapper;
  private consumers: {
    queue: string;
    handler: (message: any, headers: any) => Promise<void>;
  }[] = [];

  constructor(
    private readonly configService: ConfigService,
    @Inject('AMQP_CONNECTION_MANAGER')
    private readonly connectionManager: AmqpConnectionManager,
  ) {}

  onModuleInit() {
    this.initializeChannel();
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
  }

  private initializeChannel() {
    this.channelWrapper = this.connectionManager.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        // Setup topology
        await this.setupTopology(channel);
        // Re-register consumers if any
        await this.reRegisterConsumers(channel);
      },
    });

    this.channelWrapper.on('connect', () => {
      this.logger.log('RabbitMQ channel connected');
    });

    this.channelWrapper.on('error', (err) => {
      this.logger.error('RabbitMQ channel error:', err.message);
    });

    this.channelWrapper.on('close', () => {
      this.logger.warn('RabbitMQ channel closed');
    });
  }

  // ─── Setup Exchanges + Queues + Bindings ───────
  private async setupTopology(channel: ConfirmChannel) {
    // 1. Main exchange (topic) — nhận messages từ producers
    await channel.assertExchange(EXCHANGES.MAIN, 'topic', {
      durable: true,
    });

    // 2. Retry exchange (direct) — delay rồi đẩy lại main queue
    await channel.assertExchange(EXCHANGES.RETRY, 'direct', {
      durable: true,
    });

    // 3. DLQ exchange (fanout) — nhận messages fail vĩnh viễn
    await channel.assertExchange(EXCHANGES.DLQ, 'fanout', {
      durable: true,
    });

    // ── Email Queue ──
    await channel.assertQueue(QUEUES.EMAIL, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.DLQ,
      },
    });
    await channel.bindQueue(
      QUEUES.EMAIL,
      EXCHANGES.MAIN,
      ROUTING_KEYS.EMAIL_ALL,
    );

    // ── Retry Queue (với TTL) ──
    await channel.assertQueue(QUEUES.EMAIL_RETRY, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.MAIN,
        'x-dead-letter-routing-key': 'email.retry',
        'x-message-ttl': RETRY_DELAYS[0],
      },
    });
    await channel.bindQueue(QUEUES.EMAIL_RETRY, EXCHANGES.RETRY, 'email.retry');

    await channel.bindQueue(QUEUES.EMAIL, EXCHANGES.MAIN, 'email.retry');

    // ── Dead Letter Queue ──
    await channel.assertQueue(QUEUES.EMAIL_DLQ, {
      durable: true,
    });
    await channel.bindQueue(QUEUES.EMAIL_DLQ, EXCHANGES.DLQ, '');

    await channel.prefetch(1);
    this.logger.log('RabbitMQ topology setup complete');
  }

  // ─── Publish message ───────────────────────────
  async publish(routingKey: string, message: any) {
    await this.channelWrapper.publish(EXCHANGES.MAIN, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      headers: {
        'x-retry-count': 0,
      },
    });

    this.logger.debug(`Published to ${routingKey}: ${JSON.stringify(message)}`);
  }

  // ─── Consume with retry/DLQ logic ──────────────
  async consume(
    queue: string,
    handler: (message: any, headers: any) => Promise<void>,
  ) {
    // Store consumer for reconnection setup
    this.consumers.push({ queue, handler });

    // Add to existing channel if connected
    // eslint-disable-next-line @typescript-eslint/require-await
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.registerConsumer(channel, queue, handler);
    });
  }

  private async reRegisterConsumers(channel: ConfirmChannel) {
    for (const { queue, handler } of this.consumers) {
      await this.registerConsumer(channel, queue, handler);
    }
  }

  private async registerConsumer(
    channel: ConfirmChannel,
    queue: string,
    handler: (message: any, headers: any) => Promise<void>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await channel.consume(queue, async (msg) => {
      if (!msg) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const content = JSON.parse(msg.content.toString());
      const headers = msg.properties.headers || {};
      const retryCount = (headers['x-retry-count'] as number) || 0;

      try {
        await handler(content, headers);
        channel.ack(msg);
        this.logger.debug(`Processed message from ${queue}`);
      } catch (error: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const err: any = error;
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Failed to process message (attempt ${retryCount + 1}/${MAX_RETRIES}): ${err.message as string}`,
        );

        if (retryCount < MAX_RETRIES) {
          const delay =
            RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];

          channel.publish(EXCHANGES.RETRY, 'email.retry', msg.content, {
            persistent: true,
            contentType: 'application/json',
            headers: {
              ...headers,
              'x-retry-count': retryCount + 1,
              'x-first-failure':
                headers['x-first-failure'] || new Date().toISOString(),
              'x-last-error': error.message,
            },
            expiration: delay.toString(),
          });

          channel.ack(msg);
          this.logger.warn(
            `Retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          );
        } else {
          channel.reject(msg, false);
          this.logger.error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Message moved to DLQ after ${MAX_RETRIES} retries: ${error.message as string}`,
          );
        }
      }
    });

    this.logger.log(`Consuming from ${queue}`);
  }

  async consumeDLQ(handler: (message: any, headers: any) => Promise<void>) {
    return this.consume(QUEUES.EMAIL_DLQ, handler);
  }

  getChannel() {
    return this.channelWrapper;
  }
}
