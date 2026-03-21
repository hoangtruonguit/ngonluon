import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MoviesModule } from '../movies/movies.module';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [MoviesModule, TmdbModule],
  controllers: [AdminController],
})
export class AdminModule {}
