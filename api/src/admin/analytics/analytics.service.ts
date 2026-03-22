import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface WatchActivityPoint {
  date: string;
  views: number;
  watchHours: number;
  completionRate: number;
}

export interface TopContentItem {
  movieId: string;
  title: string;
  posterUrl: string | null;
  value: number;
}

export interface GenrePopularityItem {
  genre: string;
  views: number;
  watchlistCount: number;
}

export interface ActivityFeedItem {
  type: 'review' | 'comment' | 'registration';
  user: { id: string; fullName: string | null; avatarUrl: string | null };
  content?: string;
  movieTitle?: string;
  rating?: number;
  createdAt: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOverviewStats() {
    const cached = await this.redis.get('admin:overview');
    if (cached) return JSON.parse(cached) as Record<string, number>;

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
      this.prisma.user.count(),
      this.prisma.movie.count(),
      this.prisma.review.count(),
      this.prisma.comment.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
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

    const rows: { date: Date; count: bigint }[] = await this.prisma.$queryRaw`
      SELECT date_trunc('day', created_at) AS date, COUNT(*)::bigint AS count
      FROM users
      WHERE created_at >= ${since}
      GROUP BY date_trunc('day', created_at)
      ORDER BY date ASC
    `;

    const result = rows.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      count: Number(r.count),
    }));

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

    const rows: {
      date: Date;
      views: bigint;
      watch_hours: number;
      completion_rate: number;
    }[] = await this.prisma.$queryRaw`
      SELECT
        date_trunc('day', last_watched_at) AS date,
        COUNT(*)::bigint AS views,
        COALESCE(SUM(progress_seconds) / 3600.0, 0) AS watch_hours,
        COALESCE(AVG(CASE WHEN is_finished THEN 1.0 ELSE 0.0 END), 0) AS completion_rate
      FROM watch_history
      WHERE last_watched_at >= ${since}
      GROUP BY date_trunc('day', last_watched_at)
      ORDER BY date ASC
    `;

    const result = rows.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      views: Number(r.views),
      watchHours: Math.round(Number(r.watch_hours) * 10) / 10,
      completionRate: Math.round(Number(r.completion_rate) * 1000) / 10,
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
      const rows = await this.prisma.watchHistory.groupBy({
        by: ['movieId'],
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: limit,
      });
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.prisma.movie.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, title: true, posterUrl: true },
      });
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      result = rows.map((r) => ({
        movieId: r.movieId,
        title: movieMap.get(r.movieId)?.title ?? 'Unknown',
        posterUrl: movieMap.get(r.movieId)?.posterUrl ?? null,
        value: r._count.movieId,
      }));
    } else if (type === 'rated') {
      const rows = await this.prisma.review.groupBy({
        by: ['movieId'],
        _avg: { rating: true },
        _count: { movieId: true },
        orderBy: { _avg: { rating: 'desc' } },
        take: limit,
      });
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.prisma.movie.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, title: true, posterUrl: true },
      });
      const movieMap = new Map(movies.map((m) => [m.id, m]));
      result = rows.map((r) => ({
        movieId: r.movieId,
        title: movieMap.get(r.movieId)?.title ?? 'Unknown',
        posterUrl: movieMap.get(r.movieId)?.posterUrl ?? null,
        value: Math.round((r._avg.rating ?? 0) * 10) / 10,
      }));
    } else {
      const rows = await this.prisma.comment.groupBy({
        by: ['movieId'],
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: limit,
      });
      const movieIds = rows.map((r) => r.movieId);
      const movies = await this.prisma.movie.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, title: true, posterUrl: true },
      });
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

    const rows: { genre: string; views: bigint; watchlist_count: bigint }[] =
      await this.prisma.$queryRaw`
      SELECT
        g.name AS genre,
        COUNT(DISTINCT wh.id)::bigint AS views,
        COUNT(DISTINCT wl.id)::bigint AS watchlist_count
      FROM genres g
      JOIN movie_genres mg ON mg.genre_id = g.id
      LEFT JOIN watch_history wh ON wh.movie_id = mg.movie_id
      LEFT JOIN watchlist wl ON wl.movie_id = mg.movie_id
      GROUP BY g.name
      ORDER BY views DESC
    `;

    const result = rows.map((r) => ({
      genre: r.genre,
      views: Number(r.views),
      watchlistCount: Number(r.watchlist_count),
    }));

    await this.redis.set(cacheKey, JSON.stringify(result), 600);
    return result;
  }

  async getRecentActivity(limit = 20): Promise<ActivityFeedItem[]> {
    const take = Math.min(limit, 50);

    const [reviews, comments, users] = await Promise.all([
      this.prisma.review.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          movie: { select: { title: true } },
        },
      }),
      this.prisma.comment.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          movie: { select: { title: true } },
        },
      }),
      this.prisma.user.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, avatarUrl: true, createdAt: true },
      }),
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
