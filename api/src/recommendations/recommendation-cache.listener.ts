import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecommendationsService } from './recommendations.service';

export class WatchHistorySavedEvent {
  constructor(public readonly userId: string) {}
}

export class WatchlistChangedEvent {
  constructor(public readonly userId: string) {}
}

export class ReviewCreatedEvent {
  constructor(public readonly userId: string) {}
}

@Injectable()
export class RecommendationCacheListener {
  private readonly logger = new Logger(RecommendationCacheListener.name);

  constructor(private readonly service: RecommendationsService) {}

  @OnEvent(WatchHistorySavedEvent.name)
  async handleWatchHistorySaved(event: WatchHistorySavedEvent) {
    this.logger.debug(
      `Invalidating profile for user ${event.userId} (watch history)`,
    );
    await this.service.invalidateUserProfile(event.userId);
  }

  @OnEvent(WatchlistChangedEvent.name)
  async handleWatchlistChanged(event: WatchlistChangedEvent) {
    this.logger.debug(
      `Invalidating profile for user ${event.userId} (watchlist)`,
    );
    await this.service.invalidateUserProfile(event.userId);
  }

  @OnEvent(ReviewCreatedEvent.name)
  async handleReviewCreated(event: ReviewCreatedEvent) {
    this.logger.debug(`Invalidating profile for user ${event.userId} (review)`);
    await this.service.invalidateUserProfile(event.userId);
  }
}
