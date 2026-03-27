import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MovieCreatedEvent,
  MovieUpdatedEvent,
  MovieDeletedEvent,
  MoviesBulkCreatedEvent,
} from '../common/events/movie.events';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class RecommendationSyncListener {
  private readonly logger = new Logger(RecommendationSyncListener.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  @OnEvent(MovieCreatedEvent.name)
  async handleMovieCreated(event: MovieCreatedEvent) {
    if (!this.embeddingService.isReady) return;
    try {
      this.logger.debug(`Embedding new movie: ${event.movieId}`);
      await this.embeddingService.embedMovie(event.movieId);
    } catch (err) {
      this.logger.warn(
        `Failed to embed movie ${event.movieId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent(MovieUpdatedEvent.name)
  async handleMovieUpdated(event: MovieUpdatedEvent) {
    if (!this.embeddingService.isReady) return;
    try {
      this.logger.debug(`Re-embedding updated movie: ${event.movieId}`);
      await this.embeddingService.embedMovie(event.movieId);
    } catch (err) {
      this.logger.warn(
        `Failed to re-embed movie ${event.movieId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent(MovieDeletedEvent.name)
  async handleMovieDeleted(event: MovieDeletedEvent) {
    if (!this.embeddingService.isReady) return;
    try {
      this.logger.debug(
        `Removing embedding for deleted movie: ${event.movieId}`,
      );
      await this.embeddingService.deleteEmbedding(event.movieId);
    } catch (err) {
      this.logger.warn(
        `Failed to delete embedding ${event.movieId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent(MoviesBulkCreatedEvent.name)
  async handleMoviesBulkCreated(event: MoviesBulkCreatedEvent) {
    if (!this.embeddingService.isReady) return;
    this.logger.debug(`Embedding ${event.movieIds.length} bulk-created movies`);
    for (const movieId of event.movieIds) {
      try {
        await this.embeddingService.embedMovie(movieId);
      } catch (err) {
        this.logger.warn(
          `Failed to embed movie ${movieId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
