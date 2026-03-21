import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService, QUEUES } from '../rabbitmq/rabbitmq.service';
import { TmdbService } from './tmdb.service';

@Injectable()
export class TmdbImportConsumer implements OnModuleInit {
  private readonly logger = new Logger(TmdbImportConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly tmdbService: TmdbService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.consume(
      QUEUES.MOVIE_IMPORT,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.handleImport.bind(this),
    );
    this.logger.log('TMDB import consumer registered');
  }

  private async handleImport(message: { tmdbIds: string[] }): Promise<void> {
    const { tmdbIds } = message;
    if (!tmdbIds || !Array.isArray(tmdbIds)) {
      this.logger.warn('Received invalid import message format');
      return;
    }

    for (const tmdbId of tmdbIds) {
      this.logger.debug(`Processing import for TMDB ID: ${tmdbId}`);

      try {
        const slug = await this.tmdbService.importSingleMovie(parseInt(tmdbId));
        this.logger.log(`Imported TMDB movie ${tmdbId} → ${slug}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // If movie already exists, don't retry
        if (msg.includes('already exists')) {
          this.logger.debug(`TMDB ${tmdbId} already in DB, skipping`);
          continue;
        }
        throw error;
      }
    }
    // Rate limit: 250ms delay between messages to respect TMDB API limits
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  private async handleRetryImport(
    message: { tmdbIds: string[] },
    headers: Record<string, unknown>,
  ): Promise<void> {
    this.logger.error(
      `Failed import for IDs: ${message.tmdbIds?.join(', ')}, ` +
        `retries: ${String(headers['x-retry-count'])}, ` +
        `last error: ${String(headers['x-last-error'])}`,
    );
    await Promise.resolve();
  }
}
