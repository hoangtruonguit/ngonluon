import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MessagingModule } from '../common/messaging/messaging.module';
import { MailModule } from '../mail/mail.module';
import { AuthMessagingConsumer } from './auth-messaging.consumer';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Algorithm and keys are set per-call in AuthService.login()
    MessagingModule,
    MailModule,
  ],
  controllers: [AuthController, AuthMessagingConsumer],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
