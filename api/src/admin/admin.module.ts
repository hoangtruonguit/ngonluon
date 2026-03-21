import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MoviesModule } from '../movies/movies.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [MoviesModule, TmdbModule, AnalyticsModule, AdminUsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
