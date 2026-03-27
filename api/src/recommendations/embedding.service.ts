import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type FeatureExtractionPipeline = (
  text: string | string[],
  options: { pooling: string; normalize: boolean },
) => Promise<{ data: Float32Array | number[]; dims: number[] }>;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: FeatureExtractionPipeline | null = null;
  private loadFailed = false;
  private readonly modelName: string;
  private readonly dimensions: number;
  private readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.modelName =
      this.config.get<string>('EMBEDDING_MODEL') ?? 'Xenova/all-MiniLM-L6-v2';
    this.dimensions = this.config.get<number>('EMBEDDING_DIMENSIONS') ?? 384;
    this.batchSize = this.config.get<number>('EMBEDDING_BATCH_SIZE') ?? 50;
  }

  async onModuleInit() {
    try {
      this.logger.log(`Loading embedding model: ${this.modelName}...`);
      const { pipeline } = await import('@huggingface/transformers');
      this.extractor = (await pipeline(
        'feature-extraction',
        this.modelName,
      )) as unknown as FeatureExtractionPipeline;
      this.logger.log('Embedding model ready');
    } catch (err) {
      this.loadFailed = true;
      this.logger.warn(
        `Failed to load embedding model: ${(err as Error).message}. Recommendations will use fallback.`,
      );
    }
  }

  /** Retry loading the model if a previous attempt failed. No-op if already loaded. */
  async retryLoad(): Promise<void> {
    if (this.extractor !== null || !this.loadFailed) return;
    this.loadFailed = false;
    await this.onModuleInit();
  }

  get isReady(): boolean {
    return this.extractor !== null;
  }

  generateMovieText(movie: {
    title: string;
    description?: string | null;
    genres?: { genre: { name: string } }[];
    cast?: { role: string; person: { name: string } }[];
  }): string {
    const parts: string[] = [`Title: ${movie.title}.`];

    if (movie.genres?.length) {
      const genreNames = movie.genres.map((g) => g.genre.name).join(', ');
      parts.push(`Genres: ${genreNames}.`);
    }

    const directors = movie.cast
      ?.filter((c) => c.role === 'DIRECTOR')
      .map((c) => c.person.name);
    if (directors?.length) {
      parts.push(`Director: ${directors.join(', ')}.`);
    }

    const actors = movie.cast
      ?.filter((c) => c.role === 'ACTOR')
      .slice(0, 5)
      .map((c) => c.person.name);
    if (actors?.length) {
      parts.push(`Cast: ${actors.join(', ')}.`);
    }

    if (movie.description) {
      // Truncate to ~200 chars — all-MiniLM-L6-v2 optimized for short texts
      const desc = movie.description.slice(0, 200);
      parts.push(`Description: ${desc}`);
    }

    return parts.join(' ');
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.extractor) throw new Error('Embedding model not loaded');
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (!this.extractor) throw new Error('Embedding model not loaded');
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const output = await this.extractor(batch, {
        pooling: 'mean',
        normalize: true,
      });
      // output.data is flat Float32Array of shape [batchSize * dims]
      const flat = Array.from(output.data as Float32Array);
      for (let j = 0; j < batch.length; j++) {
        results.push(
          flat.slice(j * this.dimensions, (j + 1) * this.dimensions),
        );
      }
    }
    return results;
  }

  async embedMovie(movieId: string): Promise<void> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: { include: { genre: true } },
        cast: { include: { person: true } },
      },
    });
    if (!movie) return;

    const text = this.generateMovieText(movie);
    const vector = await this.embedText(text);
    await this.upsertEmbedding(movieId, vector, { title: movie.title });
  }

  async embedAllMovies(): Promise<void> {
    const movies = await this.prisma.movie.findMany({
      include: {
        genres: { include: { genre: true } },
        cast: { include: { person: true } },
      },
    });

    // Filter out movies that already have embeddings
    const existing = await this.prisma.$queryRaw<{ movie_id: string }[]>`
      SELECT movie_id FROM movie_embeddings
    `;
    const existingIds = new Set(existing.map((r) => r.movie_id));
    const toEmbed = movies.filter((m) => !existingIds.has(m.id));

    if (toEmbed.length === 0) {
      this.logger.log('All movies already have embeddings');
      return;
    }

    this.logger.log(`Embedding ${toEmbed.length} movies...`);
    const start = Date.now();
    let processed = 0;

    for (let i = 0; i < toEmbed.length; i += this.batchSize) {
      const batch = toEmbed.slice(i, i + this.batchSize);
      const texts = batch.map((m) => this.generateMovieText(m));
      const vectors = await this.embedMany(texts);

      for (let j = 0; j < batch.length; j++) {
        await this.upsertEmbedding(batch[j].id, vectors[j], {
          title: batch[j].title,
        });
      }

      processed += batch.length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      this.logger.log(
        `Embedded ${processed}/${toEmbed.length} movies... (${elapsed}s elapsed)`,
      );
    }

    const total = ((Date.now() - start) / 1000).toFixed(1);
    this.logger.log(`Done: embedded ${processed} movies in ${total}s`);
  }

  async deleteEmbedding(movieId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM movie_embeddings WHERE movie_id = ${movieId}
    `;
  }

  private async upsertEmbedding(
    movieId: string,
    vector: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const vectorLiteral = `[${vector.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO movie_embeddings (movie_id, embedding, metadata, updated_at)
      VALUES (
        ${movieId},
        ${vectorLiteral}::vector,
        ${JSON.stringify(metadata)}::jsonb,
        NOW()
      )
      ON CONFLICT (movie_id) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
  }
}
