import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AnalyticsRepository } from './analytics.repository';
import {
  TimeSeriesPoint,
  WatchActivityPoint,
  TopContentItem,
  GenrePopularityItem,
  ActivityFeedItem,
  OverviewStats,
} from './interfaces/analytics.interfaces';

export type {
  TimeSeriesPoint,
  WatchActivityPoint,
  TopContentItem,
  GenrePopularityItem,
  ActivityFeedItem,
  OverviewStats,
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly redis: RedisService,
  ) {}

  async getOverviewStats() {
    const cached = await this.redis.get('admin:overview');
    if (cached) return JSON.parse(cached) as OverviewStats;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMovies,
      totalReviews,
      totalComments,
      activeSubscriptions,
      newUsersLast7d,
      newUsersLast30d,
    ] = await Promise.all([
      this.repository.countUsers(),
      this.repository.countMovies(),
      this.repository.countReviews(),
      this.repository.countComments(),
      this.repository.countActiveSubscriptions(),
      this.repository.countUsersSince(sevenDaysAgo),
      this.repository.countUsersSince(thirtyDaysAgo),
    ]);

    const result = {
      totalUsers,
      totalMovies,
      totalReviews,
      totalComments,
      activeSubscriptions,
      newUsersLast7d,
      newUsersLast30d,
    };

    await this.redis.set('admin:overview', JSON.stringify(result), 300);
    return result;
  }

  async getUserGrowth(
    period: '7d' | '30d' | '90d' = '30d',
  ): Promise<TimeSeriesPoint[]> {
    const cacheKey = `admin:user-growth:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as never;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await this.repository.getUsersSince(since);

    const grouped = new Map<string, number>();
    for (const u of users) {
      const day = u.createdAt.toISOString().split('T')[0];
      grouped.set(day, (grouped.get(day) ?? 0) + 1);
    }

    const result = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    await this.redis.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  async getWatchActivity(
    period: '7d' | '30d' | '90d' = '30d',
  ): Promise<WatchActivityPoint[]> {
    const cacheKey = `admin:watch-activity:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as never;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await this.repository.getWatchHistorySince(since);

    const grouped = new Map<
      string,
      { views: number; totalSeconds: number; finishedCount: number }
    >();
    for (const r of records) {
      const day = r.lastWatchedAt.toISOString().split('T')[0];
      const entry = grouped.get(day) ?? {
        views: 0,
        totalSeconds: 0,
        finishedCount: 0,
      };
      entry.views += 1;
      entry.totalSeconds += r.progressSeconds;
      if (r.isFinished) entry.finishedCount += 1;
      grouped.set(day, entry);
    }

    const result = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        views: data.views,
        watchHours: Math.round((data.totalSeconds / 3600) * 10) / 10,
        completionRate:
          Math.round((data.finishedCount / data.views) * 1000) / 10,
      }));

    await this.redis.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  async getTopContent(
    type: 'watched' | 'rated' | 'commented' = 'watched',
    limit = 10,
  ): Promise<TopContentItem[]> {
    const cacheKey = `admin:top-content:${type}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as never;

    let result: TopContentItem[];

    if (type === 'watched') {
      const rows = await this.repository.getTopWatchedMovies(limit);
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.repository.findMoviesByIds(movieIds);
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      result = rows.map((r) => ({
        movieId: r.movieId,
        title: movieMap.get(r.movieId)?.title ?? 'Unknown',
        posterUrl: movieMap.get(r.movieId)?.posterUrl ?? null,
        value: r._count.movieId,
      }));
    } else if (type === 'rated') {
      const rows = await this.repository.getTopRatedMovies(limit);
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.repository.findMoviesByIds(movieIds);
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      result = rows.map((r) => ({
        movieId: r.movieId,
        title: movieMap.get(r.movieId)?.title ?? 'Unknown',
        posterUrl: movieMap.get(r.movieId)?.posterUrl ?? null,
        value: Math.round((r._avg.rating ?? 0) * 10) / 10,
      }));
    } else {
      const rows = await this.repository.getTopCommentedMovies(limit);
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.repository.findMoviesByIds(movieIds);
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      result = rows.map((r) => ({
        movieId: r.movieId,
        title: movieMap.get(r.movieId)?.title ?? 'Unknown',
        posterUrl: movieMap.get(r.movieId)?.posterUrl ?? null,
        value: r._count.movieId,
      }));
    }

    await this.redis.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  async getGenrePopularity(): Promise<GenrePopularityItem[]> {
    const cacheKey = 'admin:genre-popularity';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as never;

    const result = await this.repository.getGenresWithCounts();
    result.sort((a, b) => b.views - a.views);

    await this.redis.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  async getRecentActivity(limit = 20): Promise<ActivityFeedItem[]> {
    const take = Math.min(limit, 50);

    const [reviews, comments, users] = await Promise.all([
      this.repository.getRecentReviews(take),
      this.repository.getRecentComments(take),
      this.repository.getRecentUsers(take),
    ]);

    const items: ActivityFeedItem[] = [
      ...reviews.map((r) => ({
        type: 'review' as const,
        user: r.user,
        content: r.comment ?? undefined,
        movieTitle: r.movie.title,
        rating: r.rating,
        createdAt: r.createdAt.toISOString(),
      })),
      ...comments.map((c) => ({
        type: 'comment' as const,
        user: c.user,
        content: c.content,
        movieTitle: c.movie.title,
        createdAt: c.createdAt.toISOString(),
      })),
      ...users.map((u) => ({
        type: 'registration' as const,
        user: { id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl },
        createdAt: u.createdAt.toISOString(),
      })),
    ];

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return items.slice(0, take);
  }
}
