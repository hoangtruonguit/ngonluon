import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RawMovieRow,
  UserInteraction,
} from './interfaces/recommendation.interfaces';

@Injectable()
export class RecommendationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Movie similarity queries (pgvector) ──────────────────────────────────

  async findSimilarMovies(
    movieId: string,
    limit: number,
    excludeIds: string[] = [],
  ): Promise<RawMovieRow[]> {
    const excludeList = [movieId, ...excludeIds];
    // Use string interpolation for the array since Prisma raw doesn't support arrays well
    const excludePlaceholders = excludeList
      .map((_, i) => `$${i + 2}`)
      .join(', ');

    const rows = await this.prisma.$queryRawUnsafe<RawMovieRow[]>(
      `
      SELECT
        m.id, m.title, m.slug, m.poster_url, m.release_year,
        m.rating, m.type, m.is_premium,
        1 - (me.embedding <=> target.embedding) AS similarity
      FROM movie_embeddings me
      JOIN movies m ON m.id = me.movie_id
      CROSS JOIN (
        SELECT embedding FROM movie_embeddings WHERE movie_id = $1
      ) target
      WHERE me.movie_id NOT IN (${excludePlaceholders})
      ORDER BY me.embedding <=> target.embedding
      LIMIT ${limit}
      `,
      movieId,
      ...excludeList,
    );

    return rows;
  }

  async findByUserVector(
    userVector: number[],
    limit: number,
    excludeIds: string[],
  ): Promise<RawMovieRow[]> {
    const vectorLiteral = `[${userVector.join(',')}]`;

    if (excludeIds.length === 0) {
      return this.prisma.$queryRawUnsafe<RawMovieRow[]>(
        `
        SELECT
          m.id, m.title, m.slug, m.poster_url, m.release_year,
          m.rating, m.type, m.is_premium,
          1 - (me.embedding <=> '${vectorLiteral}'::vector) AS similarity
        FROM movie_embeddings me
        JOIN movies m ON m.id = me.movie_id
        ORDER BY me.embedding <=> '${vectorLiteral}'::vector
        LIMIT ${limit}
        `,
      );
    }

    const excludePlaceholders = excludeIds
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    return this.prisma.$queryRawUnsafe<RawMovieRow[]>(
      `
      SELECT
        m.id, m.title, m.slug, m.poster_url, m.release_year,
        m.rating, m.type, m.is_premium,
        1 - (me.embedding <=> '${vectorLiteral}'::vector) AS similarity
      FROM movie_embeddings me
      JOIN movies m ON m.id = me.movie_id
      WHERE me.movie_id NOT IN (${excludePlaceholders})
      ORDER BY me.embedding <=> '${vectorLiteral}'::vector
      LIMIT ${limit}
      `,
      ...excludeIds,
    );
  }

  // ─── Collaborative filtering queries ──────────────────────────────────────

  async findUsersWithSimilarTaste(
    userId: string,
    limit: number,
  ): Promise<string[]> {
    // Find users who watched the same movies as this user and rated them similarly
    const rows = await this.prisma.$queryRaw<
      { user_id: string; overlap: number }[]
    >`
      SELECT
        wh2.user_id,
        COUNT(DISTINCT wh2.movie_id) AS overlap
      FROM watch_history wh1
      JOIN watch_history wh2
        ON wh1.movie_id = wh2.movie_id
        AND wh2.user_id != ${userId}
      WHERE wh1.user_id = ${userId}
      GROUP BY wh2.user_id
      ORDER BY overlap DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => r.user_id);
  }

  async findPopularAmongSimilarUsers(
    similarUserIds: string[],
    excludeIds: string[],
    limit: number,
  ): Promise<RawMovieRow[]> {
    if (similarUserIds.length === 0) return [];

    const userPlaceholders = similarUserIds
      .map((_, i) => `$${i + 1}`)
      .join(', ');
    const excludeOffset = similarUserIds.length;
    const excludePlaceholders =
      excludeIds.length > 0
        ? excludeIds.map((_, i) => `$${excludeOffset + i + 1}`).join(', ')
        : null;

    const excludeClause = excludePlaceholders
      ? `AND wh.movie_id NOT IN (${excludePlaceholders})`
      : '';

    return this.prisma.$queryRawUnsafe<RawMovieRow[]>(
      `
      SELECT
        m.id, m.title, m.slug, m.poster_url, m.release_year,
        m.rating, m.type, m.is_premium,
        COUNT(wh.user_id)::float / ${similarUserIds.length} AS similarity
      FROM watch_history wh
      JOIN movies m ON m.id = wh.movie_id
      WHERE wh.user_id IN (${userPlaceholders})
        ${excludeClause}
      GROUP BY m.id, m.title, m.slug, m.poster_url, m.release_year, m.rating, m.type, m.is_premium
      ORDER BY similarity DESC, m.rating DESC
      LIMIT ${limit}
      `,
      ...similarUserIds,
      ...excludeIds,
    );
  }

  // ─── User interaction data ─────────────────────────────────────────────────

  async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    // Weight formula:
    //   watched + finished  → +3.0
    //   watched + unfinished → +1.0
    //   in watchlist         → +2.0
    //   reviewed rating >= 4 → +2.5
    //   reviewed rating <= 2 → -2.0
    // Recency boost: 1 / (1 + days_since / 30)
    const rows = await this.prisma.$queryRaw<
      { movie_id: string; weight: number; embedding: string }[]
    >`
      WITH interactions AS (
        -- Watch history
        SELECT
          wh.movie_id,
          CASE WHEN wh.is_finished THEN 3.0 ELSE 1.0 END
            * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - wh.last_watched_at)) / 86400 / 30)) AS weight
        FROM watch_history wh
        WHERE wh.user_id = ${userId}

        UNION ALL

        -- Watchlist
        SELECT
          wl.movie_id,
          2.0 * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - wl.created_at)) / 86400 / 30)) AS weight
        FROM watchlist wl
        WHERE wl.user_id = ${userId}

        UNION ALL

        -- Reviews (positive & negative signals)
        SELECT
          r.movie_id,
          CASE
            WHEN r.rating >= 4 THEN 2.5
            WHEN r.rating <= 2 THEN -2.0
            ELSE 0.5
          END
          * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 / 30)) AS weight
        FROM reviews r
        WHERE r.user_id = ${userId}
      ),
      aggregated AS (
        SELECT movie_id, SUM(weight) AS total_weight
        FROM interactions
        GROUP BY movie_id
        HAVING SUM(weight) > 0
      )
      SELECT
        a.movie_id,
        a.total_weight AS weight,
        me.embedding::text AS embedding
      FROM aggregated a
      JOIN movie_embeddings me ON me.movie_id = a.movie_id
    `;

    return rows.map((r) => ({
      movieId: r.movie_id,
      weight: Number(r.weight),
      embedding: r.embedding.slice(1, -1).split(',').map(Number),
    }));
  }

  async getWatchedMovieIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.watchHistory.findMany({
      where: { userId },
      select: { movieId: true },
      distinct: ['movieId'],
    });
    return rows.map((r) => r.movieId);
  }

  async getTrendingMovieIds(days: number, limit: number): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ movie_id: string }[]>`
      SELECT movie_id, COUNT(*) AS watch_count
      FROM watch_history
      WHERE last_watched_at >= NOW() - INTERVAL '${days} days'
      GROUP BY movie_id
      ORDER BY watch_count DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => r.movie_id);
  }

  async getGenresForMovies(movieIds: string[]): Promise<Map<string, string[]>> {
    if (movieIds.length === 0) return new Map();
    const rows = await this.prisma.movieGenre.findMany({
      where: { movieId: { in: movieIds } },
      include: { genre: true },
    });
    const map = new Map<string, string[]>();
    for (const row of rows) {
      if (!map.has(row.movieId)) map.set(row.movieId, []);
      map.get(row.movieId)!.push(row.genre.name);
    }
    return map;
  }
}
