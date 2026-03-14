import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SyncService } from '../elasticsearch/sync.service';
import {
    MovieCreatedEvent,
    MovieUpdatedEvent,
    MovieDeletedEvent,
    MoviesBulkCreatedEvent,
} from '../events/movie.events';

@Injectable()
export class MovieSyncEsListener {
    private readonly logger = new Logger(MovieSyncEsListener.name);

    constructor(private readonly syncService: SyncService) {}

    @OnEvent(MovieCreatedEvent.name)
    async handleMovieCreated(event: MovieCreatedEvent) {
        this.logger.debug(`ES sync on create: ${event.movieId}`);
        await this.syncService.syncMovie(event.movieId);
    }

    @OnEvent(MovieUpdatedEvent.name)
    async handleMovieUpdated(event: MovieUpdatedEvent) {
        this.logger.debug(`ES sync on update: ${event.movieId}`);
        await this.syncService.syncMovie(event.movieId);
    }

    @OnEvent(MovieDeletedEvent.name)
    async handleMovieDeleted(event: MovieDeletedEvent) {
        this.logger.debug(`ES remove on delete: ${event.movieId}`);
        await this.syncService.removeMovie(event.movieId);
    }

    @OnEvent(MoviesBulkCreatedEvent.name)
    async handleMoviesBulkCreated(event: MoviesBulkCreatedEvent) {
        this.logger.debug(`ES bulk sync: ${event.movieIds.length} movies`);
        await this.syncService.syncMany(event.movieIds);
    }
}