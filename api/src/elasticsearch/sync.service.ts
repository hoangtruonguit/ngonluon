import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ElasticsearchService, MovieDocument } from './elasticsearch.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly esService: ElasticsearchService,
  ) {}

  // ─── Sync single movie (gọi từ event listener) ────

  async syncMovie(movieId: string) {
    const movie = await this.findMovieForSync(movieId);

    if (!movie) {
      await this.esService.removeMovie(movieId);
      return;
    }

    await this.esService.indexMovie(this.toDocument(movie));
    this.logger.debug(`Synced: ${movie.title}`);
  }

  // ─── Remove (gọi từ event listener) ────────────────

  async removeMovie(movieId: string) {
    await this.esService.removeMovie(movieId);
    this.logger.debug(`Removed from ES: ${movieId}`);
  }

  // ─── Sync nhiều movies (gọi từ bulk event) ─────────

  async syncMany(movieIds: string[]) {
    const movies = await this.prisma.movie.findMany({
      where: { id: { in: movieIds } },
      include: {
        genres: { include: { genre: true } },
        cast: { include: { person: true } },
      },
    });

    const docs = movies.map((m) => this.toDocument(m));
    await this.esService.indexMany(docs);
  }

  async syncAll() {
    this.logger.log('Starting full sync DB → ES');

    const batchSize = 100;
    let skip = 0;
    let total = 0;

    while (true) {
      const movies = await this.prisma.movie.findMany({
        skip,
        take: batchSize,
        include: {
          genres: { include: { genre: true } },
          cast: { include: { person: true } },
        },
      });

      if (movies.length === 0) break;

      const docs = movies.map((m) => this.toDocument(m));
      await this.esService.indexMany(docs);

      total += movies.length;
      skip += batchSize;

      this.logger.log(`Progress: ${total} movies indexed`);
    }

    this.logger.log(`Full sync completed: ${total} movies`);
  }

  // ─── Private: Query chỉ lấy fields cần cho ES ─────

  private findMovieForSync(movieId: string) {
    return this.prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        title: true,
        slug: true,
        posterUrl: true,
        releaseYear: true,
        rating: true,
        type: true,
        genres: {
          select: {
            genre: {
              select: { name: true },
            },
          },
        },
        cast: {
          select: {
            role: true,
            person: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  // ─── Private: Map DB → ES document ─────────────────

  private toDocument(movie: any): MovieDocument {
    return {
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      posterUrl: movie.posterUrl,
      releaseYear: movie.releaseYear,
      rating: movie.rating ?? 0,
      type: movie.type,
      genres: movie.genres?.map((mg: any) => mg.genre.name) ?? [],
      cast:
        movie.cast?.map((c: any) => ({
          name: c.person.name,
          role: c.role,
        })) ?? [],
    };
  }
}
