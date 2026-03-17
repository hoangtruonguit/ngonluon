// email/email.producer.ts
import { Injectable } from '@nestjs/common';
import { RabbitMQService, ROUTING_KEYS } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class MailProducer {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.rabbitMQService.publish(ROUTING_KEYS.EMAIL_WELCOME, {
      to,
      subject: 'Tiệc tùng thôi! Chào mừng bạn đến với NgonLuon',
      template: 'welcome-email',
      data: { fullName },
    });
  }

  async sendResetPasswordEmail(to: string, resetUrl: string) {
    await this.rabbitMQService.publish(ROUTING_KEYS.EMAIL_RESET_PASSWORD, {
      to,
      subject: 'Reset mật khẩu - NgonLuon',
      template: 'reset_password',
      data: { resetUrl },
    });
  }

  async sendSubscriptionEmail(
    to: string,
    fullName: string,
    planName: string,
    endDate: string,
  ) {
    await this.rabbitMQService.publish(ROUTING_KEYS.EMAIL_SUBSCRIPTION, {
      to,
      subject: `Nâng cấp ${planName} thành công!`,
      template: 'subscription',
      data: { fullName, planName, endDate },
    });
  }
}
