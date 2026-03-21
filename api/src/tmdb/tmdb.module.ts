import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { TmdbImportConsumer } from './tmdb-import.consumer';
import { TmdbImportProducer } from './tmdb-import.producer';
import { PrismaModule } from '../prisma/prisma.module';
import { MoviesModule } from '../movies/movies.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [HttpModule, PrismaModule, MoviesModule, RedisModule],
  providers: [TmdbService, TmdbImportConsumer, TmdbImportProducer],
  controllers: [TmdbController],
  exports: [TmdbService, TmdbImportProducer],
})
export class TmdbModule {}
