import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Command({
    name: 'sync:es',
    description: 'Sync all movies from PostgreSQL to Elasticsearch',
})
export class SyncCommand extends CommandRunner {
    private readonly logger = new Logger(SyncCommand.name);

    constructor(private readonly syncService: SyncService) {
        super();
    }

    async run(): Promise<void> {
        this.logger.log('Starting full ES sync...');
        const start = Date.now();

        await this.syncService.syncAll();

        const duration = ((Date.now() - start) / 1000).toFixed(1);
        this.logger.log(`Sync completed in ${duration}s`);
    }
}