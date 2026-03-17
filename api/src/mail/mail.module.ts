// email/email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailProducer } from './mail.producer';
import { MailConsumer } from './mail.consumer';

@Module({
  imports: [ConfigModule],
  providers: [MailService, MailProducer, MailConsumer],
  exports: [MailProducer],
})
export class MailModule {}
