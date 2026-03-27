import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmbeddingService } from './embedding.service';
import { RecommendationSyncListener } from './recommendation-sync.listener';
import { RecommendationCacheListener } from './recommendation-cache.listener';
import { RecommendationsRepository } from './recommendations.repository';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsCron } from './recommendations.cron';

@Module({
  imports: [PrismaModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [RecommendationsController],
  providers: [
    EmbeddingService,
    RecommendationSyncListener,
    RecommendationCacheListener,
    RecommendationsRepository,
    RecommendationsService,
    RecommendationsCron,
  ],
  exports: [EmbeddingService, RecommendationsService],
})
export class RecommendationsModule {}
