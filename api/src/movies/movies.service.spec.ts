/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';

const mockGenre = { id: 1, name: 'Action', slug: 'action' };

const mockMovieWithGenres = {
  id: 'movie-1',
  title: 'Test Movie',
  slug: 'test-movie',
  description: 'A test movie',
  posterUrl: 'poster.jpg',
  thumbnailUrl: 'thumb.jpg',
  trailerUrl: 'trailer.mp4',
  releaseYear: 2025,
  rating: 8.55,
  durationMinutes: 120,
  isPremium: false,
  type: 'MOVIE',
  createdAt: new Date(),
  updatedAt: new Date(),
  genres: [{ genre: mockGenre, genreId: 1, movieId: 'movie-1' }],
};

const mockDetailedMovie = {
  ...mockMovieWithGenres,
  cast: [
    {
      personId: 'person-1',
      person: { name: 'John Actor', avatarUrl: 'avatar.jpg' },
      characterName: 'Hero',
      role: 'ACTOR',
    },
  ],
  reviews: [
    {
      id: 'review-1',
      rating: 4,
      comment: 'Great movie!',
      createdAt: new Date(),
      user: { id: 'user-1', fullName: 'Reviewer', avatarUrl: null },
    },
  ],
  episodes: [{ videoUrl: 'video.mp4' }],
};

const mockPrismaService = {
  movie: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  genre: {
    findMany: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTrendingMovies()', () => {
    it('should return mapped movies ordered by rating', async () => {
      mockPrismaService.movie.findMany.mockResolvedValue([mockMovieWithGenres]);

      const result = await service.getTrendingMovies(10);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Movie');
      expect(result[0].rating).toBe(8.6); // rounded from 8.55
      expect(result[0].genres).toEqual(['Action']);
      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
          take: 10,
        }),
      );
    });
  });

  describe('getNowPlayingMovies()', () => {
    it('should filter by releaseYear >= 2024 and type MOVIE', async () => {
      mockPrismaService.movie.findMany.mockResolvedValue([mockMovieWithGenres]);

      await service.getNowPlayingMovies(20);

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { releaseYear: { gte: 2024 }, type: 'MOVIE' },
          take: 20,
        }),
      );
    });
  });

  describe('getNewReleases()', () => {
    it('should order by releaseYear desc then createdAt desc', async () => {
      mockPrismaService.movie.findMany.mockResolvedValue([mockMovieWithGenres]);

      await service.getNewReleases(5);

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ releaseYear: 'desc' }, { createdAt: 'desc' }],
          take: 5,
        }),
      );
    });
  });

  describe('searchMovies()', () => {
    it('should search with basic query', async () => {
      mockPrismaService.movie.count.mockResolvedValue(1);
      mockPrismaService.movie.findMany.mockResolvedValue([mockMovieWithGenres]);

      const result = await service.searchMovies({ q: 'test' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'MOVIE',
            title: { contains: 'test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by genre slug', async () => {
      mockPrismaService.movie.count.mockResolvedValue(0);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      await service.searchMovies({ genre: 'action' });

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            genres: { some: { genre: { slug: 'action' } } },
          }),
        }),
      );
    });

    it('should filter by year', async () => {
      mockPrismaService.movie.count.mockResolvedValue(0);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      await service.searchMovies({ year: '2025' });

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ releaseYear: 2025 }),
        }),
      );
    });

    it('should filter by minimum rating', async () => {
      mockPrismaService.movie.count.mockResolvedValue(0);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      await service.searchMovies({ rating: '7.5' });

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rating: { gte: 7.5 } }),
        }),
      );
    });

    it('should handle pagination', async () => {
      mockPrismaService.movie.count.mockResolvedValue(25);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      const result = await service.searchMovies({ page: '2', limit: '10' });

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should sort by newest when sortBy=newest', async () => {
      mockPrismaService.movie.count.mockResolvedValue(0);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      await service.searchMovies({ sortBy: 'newest' });

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { releaseYear: 'desc' } }),
      );
    });

    it('should sort by rating when sortBy=rating', async () => {
      mockPrismaService.movie.count.mockResolvedValue(0);
      mockPrismaService.movie.findMany.mockResolvedValue([]);

      await service.searchMovies({ sortBy: 'rating' });

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { rating: 'desc' } }),
      );
    });
  });

  describe('getMovieBySlug()', () => {
    it('should return mapped detailed movie when found', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockDetailedMovie);

      const result = await service.getMovieBySlug('test-movie');

      expect(result).toBeDefined();
      expect(result!.title).toBe('Test Movie');
      expect(result!.videoUrl).toBe('video.mp4');
      expect(result!.cast).toHaveLength(1);
      expect(result!.cast[0].name).toBe('John Actor');
      expect(result!.audienceRating.totalReviews).toBe(1);
    });

    it('should return null when movie not found', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      const result = await service.getMovieBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addComment()', () => {
    it('should create comment when movie exists', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovieWithGenres);
      const mockComment = {
        id: 'comment-1',
        content: 'Nice!',
        isSpoiler: false,
        user: { id: 'user-1', fullName: 'User', avatarUrl: null },
      };
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.addComment('user-1', 'movie-1', {
        content: 'Nice!',
        isSpoiler: false,
      });

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 'user-1',
            movieId: 'movie-1',
            content: 'Nice!',
            isSpoiler: false,
          },
        }),
      );
    });

    it('should throw when movie not found', async () => {
      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      await expect(
        service.addComment('user-1', 'bad-id', {
          content: 'Nice!',
          isSpoiler: false,
        }),
      ).rejects.toThrow('Movie not found');
    });
  });

  describe('getCommentsByMovie()', () => {
    it('should return paginated comments', async () => {
      const mockComments = [
        {
          id: 'c1',
          content: 'Great!',
          user: { id: 'u1', fullName: 'User 1', avatarUrl: null },
        },
      ];
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.getCommentsByMovie('movie-1', 0, 10);

      expect(result).toEqual(mockComments);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { movieId: 'movie-1' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
    });
  });
});
