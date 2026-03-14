import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TmdbService } from './tmdb.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tmdbService = app.get(TmdbService);

  console.log('Starting TMDB data seeding...');

  try {
    console.log('1. Seeding Genres...');
    await tmdbService.seedGenres();

    const pages = 2;
    console.log(`2. Seeding Popular Movies (Pages 1-${pages})...`);
    await tmdbService.seedPopularMovies(pages);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap().catch((err) => {
  console.error('Unhandled error during bootstrap:', err);
  process.exit(1);
});
