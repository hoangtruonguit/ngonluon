import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async handleExpiredSubscriptions() {
    this.logger.log('Running expired subscriptions check...');
    await this.subscriptionsService.expireOverdueSubscriptions();
  }
}
