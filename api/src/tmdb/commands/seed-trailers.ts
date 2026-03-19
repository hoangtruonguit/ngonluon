import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { TmdbService } from '../tmdb.service';
import { logger as winstonLogger } from '../../common/logger/logger.config';

const logger = new Logger('TmdbSeedTrailers');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: winstonLogger,
  });
  const tmdbService = app.get(TmdbService);

  logger.log('Starting missing trailers seed...');

  try {
    await tmdbService.seedMissingTrailers();
    logger.log('Trailer seeding completed successfully!');
  } catch (error) {
    logger.error(
      'Trailer seeding failed:',
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
