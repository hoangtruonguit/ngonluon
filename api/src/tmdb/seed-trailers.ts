import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TmdbService } from './tmdb.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const tmdbService = app.get(TmdbService);

    console.log('Starting missing trailers seed...');

    try {
        await tmdbService.seedMissingTrailers();
        console.log('Trailer seeding completed successfully!');
    } catch (error) {
        console.error('Trailer seeding failed:', error);
    } finally {
        await app.close();
        process.exit(0);
    }
}

bootstrap();
