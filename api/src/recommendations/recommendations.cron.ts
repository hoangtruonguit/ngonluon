import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { RecommendationsService } from './recommendations.service';

@Injectable()
export class RecommendationsCron {
  private readonly logger = new Logger(RecommendationsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /**
   * Every 6 hours — embed any movies that are missing embeddings.
   * Local inference, no API cost, no rate limit.
   */
  @Cron('0 */6 * * *')
  async embedNewMovies() {
    if (!this.embeddingService.isReady) {
      this.logger.warn('Skipping embedNewMovies cron: model not loaded');
      return;
    }

    this.logger.log('Cron: checking for movies without embeddings...');
    try {
      await this.embeddingService.embedAllMovies();
    } catch (err) {
      this.logger.error(
        `embedNewMovies cron failed: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Daily at 3 AM — pre-warm recommendation cache for the 100 most active users
   * so their first request of the day is instant.
   */
  @Cron('0 3 * * *')
  async recomputePopularProfiles() {
    this.logger.log(
      'Cron: pre-warming recommendation cache for active users...',
    );
    try {
      // Top 100 users by watch history count in the last 30 days
      const activeUsers = await this.prisma.$queryRaw<{ user_id: string }[]>`
        SELECT user_id, COUNT(*) AS activity
        FROM watch_history
        WHERE last_watched_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
        ORDER BY activity DESC
        LIMIT 100
      `;

      this.logger.log(`Pre-warming ${activeUsers.length} active user profiles`);
      let warmed = 0;

      for (const { user_id } of activeUsers) {
        try {
          // Invalidate stale cache then rebuild — buildUserProfile caches the result
          await this.recommendationsService.invalidateUserProfile(user_id);
          await this.recommendationsService.buildUserProfile(user_id);
          await this.recommendationsService.getForYou(user_id, 20);
          warmed++;
        } catch (err) {
          this.logger.warn(
            `Failed to pre-warm profile for ${user_id}: ${(err as Error).message}`,
          );
        }
      }

      this.logger.log(
        `Done: pre-warmed ${warmed}/${activeUsers.length} profiles`,
      );
    } catch (err) {
      this.logger.error(
        `recomputePopularProfiles cron failed: ${(err as Error).message}`,
      );
    }
  }
}
