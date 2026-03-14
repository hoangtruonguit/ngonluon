import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailService } from '../mail/mail.service';

@Controller()
export class AuthMessagingConsumer {
  constructor(private readonly mailService: MailService) {}

  @EventPattern('user_registered')
  async handleUserRegistered(
    @Payload() data: { email: string; fullName: string },
  ) {
    await this.mailService.sendWelcomeEmail(data.email, data.fullName);
  }
}
