import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { TmdbService } from '../tmdb.service';
import { logger as winstonLogger } from '../../common/logger/logger.config';

const logger = new Logger('TmdbSeed');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: winstonLogger,
  });
  const tmdbService = app.get(TmdbService);

  logger.log('Starting TMDB data seeding...');

  try {
    logger.log('1. Seeding Genres...');
    await tmdbService.seedGenres();

    const pages = 2;
    logger.log(`2. Seeding Popular Movies (Pages 1-${pages})...`);
    await tmdbService.seedPopularMovies(pages);

    logger.log('Seeding completed successfully!');
  } catch (error) {
    logger.error(
      'Seeding failed:',
      error instanceof Error ? error.stack : String(error),
    );
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap().catch((err) => {
  logger.error(
    'Unhandled error during bootstrap:',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
