import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [HttpModule, PrismaModule, MoviesModule],
  providers: [TmdbService],
  controllers: [TmdbController],
  exports: [TmdbService],
})
export class TmdbModule {}
