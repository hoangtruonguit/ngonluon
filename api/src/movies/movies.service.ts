import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) { }

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

    return movies.map((movie) => this.mapMovieResponse(movie));
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

    return movies.map((movie) => this.mapMovieResponse(movie));
  }

  async getNewReleases(limit: number = 20) {
    // Order by releaseYear desc to get newest 
    // fallback to createdAt desc
    const movies = await this.prisma.movie.findMany({
      orderBy: [
        { releaseYear: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    return movies.map((movie) => this.mapMovieResponse(movie));
  }

  async getGenres() {
    return this.prisma.genre.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async searchMovies(params: SearchMoviesDto) {
    const { q, genre, year, rating, sortBy, page, limit } = params;
    
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const skip = Math.max(0, (parsedPage - 1) * parsedLimit);

    const where: Prisma.MovieWhereInput = {
      type: 'MOVIE',
    };

    if (q) {
      where.title = {
        contains: q,
        mode: 'insensitive',
      };
    }

    if (genre) {
      where.genres = {
        some: {
          genre: {
            slug: genre,
          },
        },
      };
    }

    if (year) {
      where.releaseYear = parseInt(year, 10);
    }

    if (rating) {
      const minRating = parseFloat(rating);
      where.rating = {
        gte: minRating,
      };
    }

    let orderBy: Prisma.MovieOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (sortBy === 'newest') {
      orderBy = { releaseYear: 'desc' }; // or createdAt
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'popularity') {
      // We don't have a strict popularity view count yet, so rating desc
      orderBy = { rating: 'desc' };
    }

    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
      })
    ]);

    return {
      data: movies.map((m) => this.mapMovieResponse(m)),
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      }
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
      },
    });

    if (!movie) {
      return null;
    }

    return this.mapDetailedMovieResponse(movie);
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

    return similar.map((m) => this.mapMovieResponse(m));
  }

  async addComment(userId: string, movieId: string, dto: CreateCommentDto) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      throw new Error('Movie not found');
    }

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

  async getCommentsByMovie(movieId: string, skip: number = 0, take: number = 20) {
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

  private mapMovieResponse(movie: any) {
    return {
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      posterUrl: movie.posterUrl,
      thumbnailUrl: movie.thumbnailUrl,
      trailerUrl: movie.trailerUrl,
      releaseYear: movie.releaseYear,
      rating: Math.round(movie.rating * 10) / 10,
      durationMinutes: movie.durationMinutes,
      isVip: movie.isVip,
      type: movie.type,
      genres: movie.genres.map((mg: any) => mg.genre.name),
    };
  }

  private mapDetailedMovieResponse(movie: any) {
    const reviews = movie.reviews || [];
    const totalReviews = reviews.length;
    const ratingCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    let ratingSum = 0;

    for (const review of reviews) {
      const r = Math.max(1, Math.min(5, review.rating));
      ratingCounts[r - 1]++;
      ratingSum += r;
    }

    const averageRating = totalReviews > 0
      ? Math.round((ratingSum / totalReviews) * 10) / 10
      : 0;

    const ratingDistribution = ratingCounts.map((count) => ({
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    }));

    // For movies, we might want to pick the first episode's videoUrl if it's a movie type
    // This project structure seems to link movies to episodes for video content
    const videoUrl = movie.episodes?.[0]?.videoUrl || movie.trailerUrl || '';

    return {
      ...this.mapMovieResponse(movie),
      videoUrl,
      cast: movie.cast.map((c: any) => ({
        personId: c.personId,
        name: c.person.name,
        avatarUrl: c.person.avatarUrl,
        characterName: c.characterName,
        role: c.role,
      })),
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          fullName: r.user.fullName,
          avatarUrl: r.user.avatarUrl,
        },
      })),
      audienceRating: {
        average: averageRating,
        totalReviews,
        distribution: ratingDistribution.reverse(), // 5 stars first
      },
    };
  }
}
