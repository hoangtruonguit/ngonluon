import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';
import { CreateReviewDto } from './dto/review.dto';
import { SearchQueryDto, SortByOption } from '../common/dto/search-query.dto';
import { Prisma } from '@prisma/client';
import { ReviewCreatedEvent } from '../recommendations/recommendation-cache.listener';
import { MovieMapper } from './mapper/movie.mapper';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getTrendingMovies(limit: number = 20) {
    // Here we just order by rating to simulate "trending"
    // In reality, this could be ordered by popularity or views
    const movies = await this.prisma.movie.findMany({
      orderBy: {
        rating: 'desc',
      },
      take: limit,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    return movies.map((movie) => MovieMapper.toResponse(movie));
  }

  async getNowPlayingMovies(limit: number = 20) {
    // Find movies from 2024 and 2025, or just top recent ones
    const movies = await this.prisma.movie.findMany({
      where: {
        releaseYear: {
          gte: 2024,
        },
        type: 'MOVIE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    return movies.map((movie) => MovieMapper.toResponse(movie));
  }

  async getNewReleases(limit: number = 20) {
    // Order by releaseYear desc to get newest
    // fallback to createdAt desc
    const movies = await this.prisma.movie.findMany({
      orderBy: [{ releaseYear: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    return movies.map((movie) => MovieMapper.toResponse(movie));
  }

  async getGenres() {
    return this.prisma.genre.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async searchMovies(params: SearchQueryDto) {
    const {
      q,
      genre,
      yearFrom,
      yearTo,
      minRating,
      sortBy,
      page = 1,
      limit = 20,
    } = params;
    this.logger.log(`Search movies: q=${q}, genre=${genre}, page=${page}`);

    const skip = Math.max(0, (page - 1) * limit);

    const where: Prisma.MovieWhereInput = {
      type: 'MOVIE',
    };

    if (q) {
      where.title = { contains: q, mode: 'insensitive' };
    }

    if (genre) {
      where.genres = { some: { genre: { slug: genre } } };
    }

    if (yearFrom) {
      where.releaseYear = yearTo ? { gte: yearFrom, lte: yearTo } : yearFrom;
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    let orderBy: Prisma.MovieOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === SortByOption.NEWEST) {
      orderBy = { releaseYear: 'desc' };
    } else if (
      sortBy === SortByOption.RATING ||
      sortBy === SortByOption.POPULARITY
    ) {
      orderBy = { rating: 'desc' };
    }

    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { genres: { include: { genre: true } } },
      }),
    ]);

    return {
      data: movies.map((m) => MovieMapper.toResponse(m)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMovieBySlug(slug: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: {
        genres: { include: { genre: true } },
        cast: {
          include: { person: true },
          orderBy: { role: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        episodes: true,
      },
    });

    if (!movie) {
      this.logger.warn(`Movie not found: ${slug}`);
      return null;
    }

    return MovieMapper.toDetailedResponse(movie);
  }

  async getSimilarMovies(slug: string, limit: number = 5) {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: { genres: true },
    });

    if (!movie) {
      return [];
    }

    const genreIds = movie.genres.map((mg) => mg.genreId);

    const similar = await this.prisma.movie.findMany({
      where: {
        id: { not: movie.id },
        genres: { some: { genreId: { in: genreIds } } },
      },
      orderBy: { rating: 'desc' },
      take: limit,
      include: {
        genres: { include: { genre: true } },
      },
    });

    return similar.map((m) => MovieMapper.toResponse(m));
  }

  async addComment(userId: string, movieId: string, dto: CreateCommentDto) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    this.logger.log(`Comment added to movie ${movieId} by user ${userId}`);

    return this.prisma.comment.create({
      data: {
        userId,
        movieId,
        content: dto.content,
        isSpoiler: dto.isSpoiler || false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getCommentsByMovie(
    movieId: string,
    skip: number = 0,
    take: number = 20,
  ) {
    return this.prisma.comment.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async addReview(userId: string, movieId: string, dto: CreateReviewDto) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    this.logger.log(`Review upserted for movie ${movieId} by user ${userId}`);

    const result = await this.prisma.review.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: {
        userId,
        movieId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.eventEmitter.emit(
      ReviewCreatedEvent.name,
      new ReviewCreatedEvent(userId),
    );
    return result;
  }

  async getReviewsByMovie(
    movieId: string,
    skip: number = 0,
    take: number = 20,
  ) {
    return this.prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
