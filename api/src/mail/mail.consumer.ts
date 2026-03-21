// email/email.consumer.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService, QUEUES } from '../rabbitmq/rabbitmq.service';
import { MailService, EmailPayload } from './mail.service';

@Injectable()
export class MailConsumer implements OnModuleInit {
  private readonly logger = new Logger(MailConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    // Consume email queue
    await this.rabbitMQService.consume(
      QUEUES.EMAIL,
      async (message: EmailPayload, headers: Record<string, any>) => {
        const retryCount = (headers['x-retry-count'] as number) || 0;

        this.logger.log(
          `Processing email to ${message.to} [attempt ${retryCount + 1}]`,
        );

        await this.mailService.send(message);
      },
    );

    // Consume DLQ — log failed emails cho monitoring
    await this.rabbitMQService.consumeDLQ(
      async (message: EmailPayload, headers: Record<string, any>) => {
        this.logger.error(
          `DLQ: Email permanently failed — to: ${message.to}, ` +
            `subject: ${message.subject}, ` +
            `retries: ${headers['x-retry-count'] as number}, ` +
            `first failure: ${headers['x-first-failure'] as string}, ` +
            `last error: ${headers['x-last-error'] as string}`,
        );
        await Promise.resolve(); // Satisfy require-await
      },
    );

    this.logger.log('Email consumers started');
  }
}
