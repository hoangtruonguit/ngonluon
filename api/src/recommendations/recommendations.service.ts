import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EmbeddingService } from './embedding.service';
import { RecommendationsRepository } from './recommendations.repository';
import {
  MovieRecommendation,
  RawMovieRow,
} from './interfaces/recommendation.interfaces';

const TTL = {
  userProfile: 3600, // 1 hour
  forYou: 3600, // 1 hour
  becauseYouWatched: 7200, // 2 hours
  similar: 21600, // 6 hours
  trendingForYou: 1800, // 30 minutes
};

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly repo: RecommendationsRepository,
    private readonly embedding: EmbeddingService,
    private readonly redis: RedisService,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────

  async getForYou(userId: string, limit = 20): Promise<MovieRecommendation[]> {
    const cacheKey = `rec:foryou:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as MovieRecommendation[];

    if (!this.embedding.isReady) {
      this.logger.warn(
        'getForYou: embedding model not ready, using trending fallback',
      );
      await this.embedding.retryLoad();
      return this.fallbackTrending(limit);
    }

    const t0 = Date.now();
    try {
      const [userVector, watchedIds] = await Promise.all([
        this.buildUserProfile(userId),
        this.repo.getWatchedMovieIds(userId),
      ]);

      if (!userVector) return this.fallbackTrending(limit);

      // Content-based: 70% of results
      const contentCount = Math.ceil(limit * 0.7);
      const contentRows = await this.repo.findByUserVector(
        userVector,
        contentCount * 2, // over-fetch for diversity filter
        watchedIds,
      );

      // Collaborative: 30% of results
      const collabCount = limit - contentCount;
      const collabResults = await this.getCollaborativeRecommendations(
        userId,
        collabCount,
        watchedIds,
      );

      // Merge, apply genre diversity, deduplicate, trim
      const contentRecs = await this.toRecommendations(contentRows, 'content');
      const merged = this.applyDiversity(
        [...contentRecs, ...collabResults],
        limit,
      );

      this.logger.debug(
        `getForYou userId=${userId} took ${Date.now() - t0}ms → ${merged.length} results`,
      );
      await this.redis.set(cacheKey, JSON.stringify(merged), TTL.forYou);
      return merged;
    } catch (err) {
      this.logger.warn(
        `getForYou failed after ${Date.now() - t0}ms: ${(err as Error).message}`,
      );
      return this.fallbackTrending(limit);
    }
  }

  async getBecauseYouWatched(
    userId: string,
    movieId: string,
    limit = 10,
  ): Promise<MovieRecommendation[]> {
    const cacheKey = `rec:byw:${userId}:${movieId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as MovieRecommendation[];

    if (!this.embedding.isReady) {
      this.logger.warn(
        'getBecauseYouWatched: embedding model not ready, using genre fallback',
      );
      await this.embedding.retryLoad();
      return this.fallbackSimilarByGenre(movieId, limit);
    }

    const t0 = Date.now();
    try {
      const watchedIds = await this.repo.getWatchedMovieIds(userId);
      const rows = await this.repo.findSimilarMovies(
        movieId,
        limit,
        watchedIds,
      );

      const recs = await this.toRecommendations(rows, 'similar');

      // Fetch source movie title to build reason
      const sourceMovie = await this.getMovieTitle(movieId);
      const result = recs.map((r) => ({
        ...r,
        reason: sourceMovie ? `Because you watched ${sourceMovie}` : undefined,
      }));

      this.logger.debug(
        `getBecauseYouWatched movieId=${movieId} took ${Date.now() - t0}ms`,
      );
      await this.redis.set(
        cacheKey,
        JSON.stringify(result),
        TTL.becauseYouWatched,
      );
      return result;
    } catch (err) {
      this.logger.warn(
        `getBecauseYouWatched failed after ${Date.now() - t0}ms: ${(err as Error).message}`,
      );
      return this.fallbackSimilarByGenre(movieId, limit);
    }
  }

  async getSimilarMovies(
    movieId: string,
    limit = 10,
  ): Promise<MovieRecommendation[]> {
    const cacheKey = `rec:similar:${movieId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as MovieRecommendation[];

    if (!this.embedding.isReady) {
      this.logger.warn(
        'getSimilarMovies: embedding model not ready, using genre fallback',
      );
      await this.embedding.retryLoad();
      return this.fallbackSimilarByGenre(movieId, limit);
    }

    const t0 = Date.now();
    try {
      const rows = await this.repo.findSimilarMovies(movieId, limit);
      const result = await this.toRecommendations(rows, 'similar');
      this.logger.debug(
        `getSimilarMovies movieId=${movieId} took ${Date.now() - t0}ms → ${result.length} results`,
      );
      await this.redis.set(cacheKey, JSON.stringify(result), TTL.similar);
      return result;
    } catch (err) {
      this.logger.warn(
        `getSimilarMovies failed after ${Date.now() - t0}ms: ${(err as Error).message}`,
      );
      return this.fallbackSimilarByGenre(movieId, limit);
    }
  }

  async getTrendingForYou(
    userId: string,
    limit = 10,
  ): Promise<MovieRecommendation[]> {
    const cacheKey = `rec:trending:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as MovieRecommendation[];

    try {
      const watchedIds = await this.repo.getWatchedMovieIds(userId);
      const trendingIds = await this.repo.getTrendingMovieIds(7, limit * 3);
      const candidates = trendingIds.filter((id) => !watchedIds.includes(id));

      if (!this.embedding.isReady || candidates.length === 0) {
        return this.fallbackTrending(limit);
      }

      const userVector = await this.buildUserProfile(userId);
      if (!userVector) return this.fallbackTrending(limit);

      // Re-rank trending movies by user profile similarity
      const rows = await this.repo.findByUserVector(
        userVector,
        limit,
        watchedIds.filter((id) => !candidates.includes(id)), // keep trending candidates
      );

      // Filter to only trending movies
      const trendingSet = new Set(candidates);
      const trendingRows = rows.filter((r) => trendingSet.has(r.id));

      const result = await this.toRecommendations(trendingRows, 'trending');
      await this.redis.set(
        cacheKey,
        JSON.stringify(result),
        TTL.trendingForYou,
      );
      return result;
    } catch (err) {
      this.logger.warn(`getTrendingForYou failed: ${(err as Error).message}`);
      return this.fallbackTrending(limit);
    }
  }

  // ─── User profile ─────────────────────────────────────────────────────────

  async buildUserProfile(userId: string): Promise<number[] | null> {
    const cacheKey = `profile:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`buildUserProfile userId=${userId} → cache hit`);
      return JSON.parse(cached) as number[];
    }

    const interactions = await this.repo.getUserInteractions(userId);
    if (interactions.length === 0) return null;

    const dims = interactions[0].embedding.length;
    const profileVector = new Array<number>(dims).fill(0);
    let totalWeight = 0;

    for (const { weight, embedding } of interactions) {
      const absWeight = Math.abs(weight);
      totalWeight += absWeight;
      for (let i = 0; i < dims; i++) {
        profileVector[i] += weight * embedding[i];
      }
    }

    if (totalWeight === 0) return null;

    // Normalize
    const normalized = profileVector.map((v) => v / totalWeight);

    this.logger.debug(
      `buildUserProfile userId=${userId} built from ${interactions.length} interactions`,
    );
    await this.redis.set(cacheKey, JSON.stringify(normalized), TTL.userProfile);
    return normalized;
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`profile:${userId}`),
      this.redis.del(`rec:foryou:${userId}`),
      this.redis.del(`rec:trending:${userId}`),
    ]);
  }

  // ─── Collaborative filtering ──────────────────────────────────────────────

  private async getCollaborativeRecommendations(
    userId: string,
    limit: number,
    excludeIds: string[],
  ): Promise<MovieRecommendation[]> {
    try {
      const similarUserIds = await this.repo.findUsersWithSimilarTaste(
        userId,
        20,
      );
      if (similarUserIds.length === 0) return [];

      const rows = await this.repo.findPopularAmongSimilarUsers(
        similarUserIds,
        excludeIds,
        limit,
      );

      return this.toRecommendations(rows, 'collaborative');
    } catch {
      return [];
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async toRecommendations(
    rows: RawMovieRow[],
    source: MovieRecommendation['source'],
  ): Promise<MovieRecommendation[]> {
    if (rows.length === 0) return [];

    const movieIds = rows.map((r) => r.id);
    const genreMap = await this.repo.getGenresForMovies(movieIds);

    return rows.map((row) => ({
      movie: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        posterUrl: row.poster_url,
        releaseYear: row.release_year,
        rating: Number(row.rating),
        type: row.type,
        genres: genreMap.get(row.id) ?? [],
        isPremium: row.is_premium,
      },
      score: Math.min(1, Math.max(0, Number(row.similarity))),
      source,
    }));
  }

  private applyDiversity(
    recs: MovieRecommendation[],
    limit: number,
  ): MovieRecommendation[] {
    const seen = new Set<string>();
    const genreCounts = new Map<string, number>();
    const result: MovieRecommendation[] = [];
    const MAX_PER_GENRE = 3;

    for (const rec of recs) {
      if (seen.has(rec.movie.id)) continue;

      // Check genre diversity for top 10
      if (result.length < 10) {
        const dominantGenre = rec.movie.genres[0];
        if (dominantGenre) {
          const count = genreCounts.get(dominantGenre) ?? 0;
          if (count >= MAX_PER_GENRE) continue;
          genreCounts.set(dominantGenre, count + 1);
        }
      }

      seen.add(rec.movie.id);
      result.push(rec);
      if (result.length >= limit) break;
    }

    return result;
  }

  private async fallbackTrending(
    limit: number,
  ): Promise<MovieRecommendation[]> {
    try {
      const trendingIds = await this.repo.getTrendingMovieIds(7, limit);
      if (trendingIds.length === 0) return [];

      const movies = await this.getMoviesByIds(trendingIds);
      const genreMap = await this.repo.getGenresForMovies(trendingIds);

      return movies.map((m) => ({
        movie: {
          id: m.id,
          title: m.title,
          slug: m.slug,
          posterUrl: m.posterUrl,
          releaseYear: m.releaseYear,
          rating: m.rating,
          type: m.type,
          genres: genreMap.get(m.id) ?? [],
          isPremium: m.isPremium,
        },
        score: 0,
        source: 'trending' as const,
      }));
    } catch {
      return [];
    }
  }

  private async fallbackSimilarByGenre(
    movieId: string,
    limit: number,
  ): Promise<MovieRecommendation[]> {
    try {
      const similar = await this.repo.findSimilarByGenreFallback(
        movieId,
        limit,
      );
      if (similar.length === 0) return [];

      const ids = similar.map((m) => m.id);
      const genreMap = await this.repo.getGenresForMovies(ids);

      return similar.map((m) => ({
        movie: {
          id: m.id,
          title: m.title,
          slug: m.slug,
          posterUrl: m.posterUrl,
          releaseYear: m.releaseYear,
          rating: Number(m.rating),
          type: m.type,
          genres: genreMap.get(m.id) ?? [],
          isPremium: m.isPremium,
        },
        score: 0,
        source: 'similar' as const,
      }));
    } catch {
      return [];
    }
  }

  private async getMovieTitle(movieId: string): Promise<string | null> {
    return this.repo.findMovieTitle(movieId);
  }

  private async getMoviesByIds(ids: string[]) {
    return this.repo.findMoviesByIds(ids);
  }
}
