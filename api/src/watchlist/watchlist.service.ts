import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToWatchlist(userId: string, movieId: string) {
    try {
      // Verify movie exists
      const movie = await this.prisma.movie.findUnique({
        where: { id: movieId },
      });

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${movieId} not found`);
      }

      return await this.prisma.watchlist.create({
        data: {
          userId,
          movieId,
        },
        include: {
          movie: true,
        },
      });
    } catch (error) {
      console.error('[WatchlistService] Error adding to watchlist:', error);
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Prisma unique constraint violation code
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as Record<string, any>).code === 'P2002'
      ) {
        throw new ConflictException('Movie is already in your watchlist');
      }
      throw error;
    }
  }

  async removeFromWatchlist(userId: string, movieId: string) {
    const watchlistEntry = await this.prisma.watchlist.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (!watchlistEntry) {
      throw new NotFoundException('Movie not found in your watchlist');
    }

    return this.prisma.watchlist.delete({
      where: {
        id: watchlistEntry.id,
      },
    });
  }

  async getStatus(userId: string, movieId: string) {
    try {
      const entry = await this.prisma.watchlist.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
      });

      return { isInWatchlist: !!entry };
    } catch (error) {
      console.error(
        `[WatchlistService] Error getting status for user ${userId}, movie ${movieId}:`,
        error,
      );
      throw error;
    }
  }

  async getWatchlist(userId: string) {
    try {
      return await this.prisma.watchlist.findMany({
        where: { userId },
        include: {
          movie: {
            include: {
              genres: {
                include: {
                  genre: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error(
        `[WatchlistService] Error getting watchlist for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
