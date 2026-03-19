import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveProgressDto } from './dto/save-progress.dto';

@Injectable()
export class WatchHistoryService {
  private readonly logger = new Logger(WatchHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveProgress(userId: string, dto: SaveProgressDto) {
    this.logger.log(`Saving progress for user ${userId}, movie ${dto.movieId}`);
    const existing = await this.prisma.watchHistory.findFirst({
      where: {
        userId,
        movieId: dto.movieId,
        episodeId: dto.episodeId ?? null,
      },
    });

    if (existing) {
      return this.prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progressSeconds: dto.progressSeconds,
          isFinished: dto.isFinished,
          lastWatchedAt: new Date(),
        },
      });
    }

    return this.prisma.watchHistory.create({
      data: {
        userId,
        movieId: dto.movieId,
        episodeId: dto.episodeId ?? null,
        progressSeconds: dto.progressSeconds,
        isFinished: dto.isFinished,
      },
    });
  }

  async getProgress(userId: string, movieId: string, episodeId?: string) {
    return this.prisma.watchHistory.findFirst({
      where: {
        userId,
        movieId,
        episodeId: episodeId ?? null,
      },
      orderBy: {
        lastWatchedAt: 'desc',
      },
    });
  }

  async getHistory(userId: string, limit = 20) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            posterUrl: true,
            durationMinutes: true,
          },
        },
        episode: true,
      },
      orderBy: {
        lastWatchedAt: 'desc',
      },
      take: limit,
    });
  }

  async clearHistory(userId: string) {
    this.logger.log(`Clearing history for user ${userId}`);
    return this.prisma.watchHistory.deleteMany({
      where: { userId },
    });
  }
}
