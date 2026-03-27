import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsRepository } from './recommendations.repository';
import { EmbeddingService } from './embedding.service';
import { RedisService } from '../redis/redis.service';

const mockRepo = {
  findByUserVector: jest.fn(),
  findSimilarMovies: jest.fn(),
  findUsersWithSimilarTaste: jest.fn(),
  findPopularAmongSimilarUsers: jest.fn(),
  getUserInteractions: jest.fn(),
  getWatchedMovieIds: jest.fn(),
  getTrendingMovieIds: jest.fn(),
  getGenresForMovies: jest.fn(),
};

const mockEmbedding = {
  isReady: true,
  embedMovie: jest.fn(),
  retryLoad: jest.fn().mockResolvedValue(undefined),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

function makeRow(id: string, similarity = 0.9) {
  return {
    id,
    title: `Movie ${id}`,
    slug: `movie-${id}`,
    poster_url: null,
    release_year: 2023,
    rating: 8,
    type: 'MOVIE',
    is_premium: false,
    similarity,
  };
}

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue(undefined);
    mockRedis.del.mockResolvedValue(undefined);
    mockRepo.getGenresForMovies.mockResolvedValue(new Map());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: RecommendationsRepository, useValue: mockRepo },
        { provide: EmbeddingService, useValue: mockEmbedding },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  // ─── buildUserProfile ──────────────────────────────────────────────────────

  describe('buildUserProfile', () => {
    it('returns null when user has no interactions', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([]);
      const result = await service.buildUserProfile('user-1');
      expect(result).toBeNull();
    });

    it('computes weighted average of embeddings', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([
        { movieId: 'm1', weight: 2, embedding: [1, 0, 0] },
        { movieId: 'm2', weight: 2, embedding: [0, 1, 0] },
      ]);
      const vector = await service.buildUserProfile('user-1');
      expect(vector).not.toBeNull();
      // weighted avg: (2*[1,0,0] + 2*[0,1,0]) / 4 = [0.5, 0.5, 0]
      expect(vector![0]).toBeCloseTo(0.5);
      expect(vector![1]).toBeCloseTo(0.5);
      expect(vector![2]).toBeCloseTo(0);
    });

    it('applies recency-weighted positive and negative signals', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([
        { movieId: 'm1', weight: 3, embedding: [1, 0] }, // finished watch
        { movieId: 'm2', weight: -2, embedding: [0, 1] }, // bad review
      ]);
      // total |weight| = 5, result = (3*[1,0] + (-2)*[0,1]) / 5 = [0.6, -0.4]
      const vector = await service.buildUserProfile('user-1');
      expect(vector![0]).toBeCloseTo(0.6);
      expect(vector![1]).toBeCloseTo(-0.4);
    });

    it('returns cached profile without querying DB', async () => {
      const cached = [0.5, 0.5, 0];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const vector = await service.buildUserProfile('user-1');
      expect(vector).toEqual(cached);
      expect(mockRepo.getUserInteractions).not.toHaveBeenCalled();
    });

    it('persists computed profile in redis', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([
        { movieId: 'm1', weight: 1, embedding: [1, 0] },
      ]);
      await service.buildUserProfile('user-1');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'profile:user-1',
        expect.any(String),
        3600,
      );
    });
  });

  // ─── getSimilarMovies ─────────────────────────────────────────────────────

  describe('getSimilarMovies', () => {
    it('returns similar movies from vector search', async () => {
      mockRepo.findSimilarMovies.mockResolvedValue([
        makeRow('m1'),
        makeRow('m2'),
      ]);
      const result = await service.getSimilarMovies('src-movie', 10);
      expect(result).toHaveLength(2);
      expect(result[0].source).toBe('similar');
      expect(result[0].score).toBeCloseTo(0.9);
    });

    it('returns cached result without querying DB', async () => {
      const cached = [{ movie: { id: 'm1' }, score: 0.9, source: 'similar' }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const result = await service.getSimilarMovies('src-movie', 10);
      expect(result).toEqual(cached);
      expect(mockRepo.findSimilarMovies).not.toHaveBeenCalled();
    });

    it('falls back to genre-based when embedding model not ready', async () => {
      mockEmbedding.isReady = false;
      // fallback queries prisma directly via repo['prisma'] — patch it inline
      const fallbackSpy = jest
        .spyOn(service as any, 'fallbackSimilarByGenre')
        .mockResolvedValue([]);
      await service.getSimilarMovies('src-movie', 10);
      expect(fallbackSpy).toHaveBeenCalledWith('src-movie', 10);
      mockEmbedding.isReady = true;
    });
  });

  // ─── getForYou ─────────────────────────────────────────────────────────────

  describe('getForYou', () => {
    it('returns empty array when user has no profile and embedding not ready', async () => {
      mockEmbedding.isReady = false;
      mockRepo.getTrendingMovieIds.mockResolvedValue([]);
      const result = await service.getForYou('user-1', 10);
      expect(result).toEqual([]);
      mockEmbedding.isReady = true;
    });

    it('returns null and falls back to trending when user has no interactions', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([]);
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.getTrendingMovieIds.mockResolvedValue([]);
      const result = await service.getForYou('user-1', 10);
      expect(result).toEqual([]);
    });

    it('applies genre diversity — max 3 per genre in top 10', async () => {
      mockRepo.getUserInteractions.mockResolvedValue([
        { movieId: 'm0', weight: 1, embedding: [1, 0] },
      ]);
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      // 6 Action rows + 1 Drama row — should cap Action at 3 in top 10
      const actionRows = Array.from({ length: 6 }, (_, i) =>
        makeRow(`action-${i}`, 0.95 - i * 0.01),
      );
      mockRepo.findByUserVector.mockResolvedValue(actionRows);
      mockRepo.findUsersWithSimilarTaste.mockResolvedValue([]);
      mockRepo.getGenresForMovies.mockImplementation((ids: string[]) => {
        const map = new Map<string, string[]>();
        ids.forEach((id) => map.set(id, ['Action']));
        return Promise.resolve(map);
      });

      const result = await service.getForYou('user-1', 10);
      const actionCount = result.filter(
        (r) => r.movie.genres[0] === 'Action',
      ).length;
      expect(actionCount).toBeLessThanOrEqual(3);
    });
  });

  // ─── invalidateUserProfile ────────────────────────────────────────────────

  describe('invalidateUserProfile', () => {
    it('deletes profile and recommendation caches', async () => {
      await service.invalidateUserProfile('user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('profile:user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('rec:foryou:user-1');
      expect(mockRedis.del).toHaveBeenCalledWith('rec:trending:user-1');
    });
  });

  // ─── getBecauseYouWatched ─────────────────────────────────────────────────

  describe('getBecauseYouWatched', () => {
    it('returns cached result without querying DB', async () => {
      const cached = [
        {
          movie: { id: 'm1', title: 'Movie m1' },
          score: 0.85,
          source: 'similar',
        },
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const result = await service.getBecauseYouWatched(
        'user-1',
        'src-movie',
        5,
      );
      expect(result).toEqual(cached);
      expect(mockRepo.findSimilarMovies).not.toHaveBeenCalled();
    });

    it('falls back to genre-based when embedding model not ready', async () => {
      mockEmbedding.isReady = false;
      const fallbackSpy = jest
        .spyOn(service as any, 'fallbackSimilarByGenre')
        .mockResolvedValue([]);
      await service.getBecauseYouWatched('user-1', 'src-movie', 5);
      expect(fallbackSpy).toHaveBeenCalledWith('src-movie', 5);
      mockEmbedding.isReady = true;
    });

    it('attaches because-you-watched reason to results', async () => {
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.findSimilarMovies.mockResolvedValue([makeRow('m1', 0.88)]);
      const getMovieTitleSpy = jest
        .spyOn(service as any, 'getMovieTitle')
        .mockResolvedValue('Inception');
      const result = await service.getBecauseYouWatched(
        'user-1',
        'inception-id',
        5,
      );
      expect(result[0].reason).toBe('Because you watched Inception');
      getMovieTitleSpy.mockRestore();
    });

    it('omits reason when source movie not found', async () => {
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.findSimilarMovies.mockResolvedValue([makeRow('m1', 0.8)]);
      const getMovieTitleSpy = jest
        .spyOn(service as any, 'getMovieTitle')
        .mockResolvedValue(null);
      const result = await service.getBecauseYouWatched(
        'user-1',
        'unknown-id',
        5,
      );
      expect(result[0].reason).toBeUndefined();
      getMovieTitleSpy.mockRestore();
    });
  });

  // ─── getTrendingForYou ────────────────────────────────────────────────────

  describe('getTrendingForYou', () => {
    it('returns cached result without querying DB', async () => {
      const cached = [{ movie: { id: 'm1' }, score: 0.7, source: 'trending' }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const result = await service.getTrendingForYou('user-1', 10);
      expect(result).toEqual(cached);
      expect(mockRepo.getTrendingMovieIds).not.toHaveBeenCalled();
    });

    it('falls back to trending when embedding model not ready', async () => {
      mockEmbedding.isReady = false;
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.getTrendingMovieIds.mockResolvedValue([]);
      const fallbackSpy = jest
        .spyOn(service as any, 'fallbackTrending')
        .mockResolvedValue([]);
      await service.getTrendingForYou('user-1', 10);
      expect(fallbackSpy).toHaveBeenCalled();
      mockEmbedding.isReady = true;
    });

    it('falls back when no trending candidates exist', async () => {
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.getTrendingMovieIds.mockResolvedValue([]);
      const fallbackSpy = jest
        .spyOn(service as any, 'fallbackTrending')
        .mockResolvedValue([]);
      await service.getTrendingForYou('user-1', 10);
      expect(fallbackSpy).toHaveBeenCalled();
    });

    it('falls back when user has no interactions to build profile', async () => {
      mockRepo.getWatchedMovieIds.mockResolvedValue([]);
      mockRepo.getTrendingMovieIds.mockResolvedValue(['m1', 'm2']);
      mockRepo.getUserInteractions.mockResolvedValue([]);
      const fallbackSpy = jest
        .spyOn(service as any, 'fallbackTrending')
        .mockResolvedValue([]);
      await service.getTrendingForYou('user-1', 10);
      expect(fallbackSpy).toHaveBeenCalled();
    });
  });
});
