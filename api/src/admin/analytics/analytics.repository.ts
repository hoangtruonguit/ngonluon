import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countUsers() {
    return this.prisma.user.count();
  }

  async countMovies() {
    return this.prisma.movie.count();
  }

  async countReviews() {
    return this.prisma.review.count();
  }

  async countComments() {
    return this.prisma.comment.count();
  }

  async countActiveSubscriptions() {
    return this.prisma.subscription.count({ where: { status: 'ACTIVE' } });
  }

  async countUsersSince(since: Date) {
    return this.prisma.user.count({ where: { createdAt: { gte: since } } });
  }

  async getUsersSince(since: Date) {
    return this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getWatchHistorySince(since: Date) {
    return this.prisma.watchHistory.findMany({
      where: { lastWatchedAt: { gte: since } },
      select: {
        lastWatchedAt: true,
        progressSeconds: true,
        isFinished: true,
      },
      orderBy: { lastWatchedAt: 'asc' },
    });
  }

  async getTopWatchedMovies(limit: number) {
    return this.prisma.watchHistory.groupBy({
      by: ['movieId'],
      _count: { movieId: true },
      orderBy: { _count: { movieId: 'desc' } },
      take: limit,
    });
  }

  async getTopRatedMovies(limit: number) {
    return this.prisma.review.groupBy({
      by: ['movieId'],
      _avg: { rating: true },
      _count: { movieId: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });
  }

  async getTopCommentedMovies(limit: number) {
    return this.prisma.comment.groupBy({
      by: ['movieId'],
      _count: { movieId: true },
      orderBy: { _count: { movieId: 'desc' } },
      take: limit,
    });
  }

  async findMoviesByIds(ids: string[]) {
    return this.prisma.movie.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, posterUrl: true },
    });
  }

  async getGenresWithCounts() {
    const genres = await this.prisma.genre.findMany({
      select: {
        name: true,
        movies: { select: { movieId: true } },
      },
      orderBy: { name: 'asc' },
    });

    const genreMovieMap = new Map<string, string[]>();
    for (const g of genres) {
      genreMovieMap.set(
        g.name,
        g.movies.map((m) => m.movieId),
      );
    }

    const allMovieIds = [
      ...new Set(genres.flatMap((g) => g.movies.map((m) => m.movieId))),
    ];

    const [watchCounts, watchlistCounts] = await Promise.all([
      this.prisma.watchHistory.groupBy({
        by: ['movieId'],
        where: { movieId: { in: allMovieIds } },
        _count: { id: true },
      }),
      this.prisma.watchlist.groupBy({
        by: ['movieId'],
        where: { movieId: { in: allMovieIds } },
        _count: { id: true },
      }),
    ]);

    const watchByMovie = new Map(
      watchCounts.map((w) => [w.movieId, w._count.id]),
    );
    const watchlistByMovie = new Map(
      watchlistCounts.map((w) => [w.movieId, w._count.id]),
    );

    return genres.map((g) => {
      const movieIds = genreMovieMap.get(g.name) ?? [];
      let views = 0;
      let watchlistCount = 0;
      for (const mid of movieIds) {
        views += watchByMovie.get(mid) ?? 0;
        watchlistCount += watchlistByMovie.get(mid) ?? 0;
      }
      return { genre: g.name, views, watchlistCount };
    });
  }

  async getRecentReviews(take: number) {
    return this.prisma.review.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        movie: { select: { title: true } },
      },
    });
  }

  async getRecentComments(take: number) {
    return this.prisma.comment.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        movie: { select: { title: true } },
      },
    });
  }

  async getRecentUsers(take: number) {
    return this.prisma.user.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
}
