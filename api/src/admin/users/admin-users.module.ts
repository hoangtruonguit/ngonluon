import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersRepository } from './admin-users.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersRepository, AdminUsersService],
})
export class AdminUsersModule {}
