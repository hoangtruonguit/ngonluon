import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface AuthRequest {
  user: { userId?: string; id?: string };
}

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('for-you')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Personalised recommendations based on watch history',
  })
  @ApiResponse({ status: 200, description: 'List of recommended movies' })
  getForYou(@Req() req: AuthRequest, @Query() query: RecommendationQueryDto) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getForYou(userId, query.limit);
  }

  @Get('because-you-watched/:movieId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Movies similar to a specific watched movie' })
  @ApiResponse({ status: 200, description: 'List of similar movies' })
  getBecauseYouWatched(
    @Req() req: AuthRequest,
    @Param('movieId') movieId: string,
    @Query() query: RecommendationQueryDto,
  ) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getBecauseYouWatched(userId, movieId, query.limit);
  }

  @Get('similar/:movieId')
  @ApiOperation({
    summary: 'Movies similar to the given movie (no auth required)',
  })
  @ApiResponse({ status: 200, description: 'List of similar movies' })
  getSimilar(
    @Param('movieId') movieId: string,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.service.getSimilarMovies(movieId, query.limit);
  }

  @Get('trending-for-you')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trending movies re-ranked by user taste' })
  @ApiResponse({ status: 200, description: 'List of trending movies' })
  getTrendingForYou(
    @Req() req: AuthRequest,
    @Query() query: RecommendationQueryDto,
  ) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getTrendingForYou(userId, query.limit);
  }
}
