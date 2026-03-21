import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverviewStats() {
    return this.analyticsService.getOverviewStats();
  }

  @Get('user-growth')
  getUserGrowth(@Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.analyticsService.getUserGrowth(period);
  }

  @Get('watch-activity')
  getWatchActivity(@Query('period') period: '7d' | '30d' | '90d' = '30d') {
    return this.analyticsService.getWatchActivity(period);
  }

  @Get('top-content')
  getTopContent(
    @Query('type') type: 'watched' | 'rated' | 'commented' = 'watched',
    @Query('limit') limit: string = '10',
  ) {
    return this.analyticsService.getTopContent(
      type,
      Math.min(parseInt(limit, 10) || 10, 50),
    );
  }

  @Get('genre-popularity')
  getGenrePopularity() {
    return this.analyticsService.getGenrePopularity();
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit: string = '20') {
    return this.analyticsService.getRecentActivity(
      Math.min(parseInt(limit, 10) || 20, 50),
    );
  }
}
