import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

interface AuthRequest {
  user: { userId?: string; id?: string };
}

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get('for-you')
  @UseGuards(JwtAuthGuard)
  getForYou(@Req() req: AuthRequest, @Query() query: RecommendationQueryDto) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getForYou(userId, query.limit);
  }

  @Get('because-you-watched/:movieId')
  @UseGuards(JwtAuthGuard)
  getBecauseYouWatched(
    @Req() req: AuthRequest,
    @Param('movieId') movieId: string,
    @Query() query: RecommendationQueryDto,
  ) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getBecauseYouWatched(userId, movieId, query.limit);
  }

  @Get('similar/:movieId')
  getSimilar(
    @Param('movieId') movieId: string,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.service.getSimilarMovies(movieId, query.limit);
  }

  @Get('trending-for-you')
  @UseGuards(JwtAuthGuard)
  getTrendingForYou(
    @Req() req: AuthRequest,
    @Query() query: RecommendationQueryDto,
  ) {
    const userId = req.user.userId ?? req.user.id!;
    return this.service.getTrendingForYou(userId, query.limit);
  }
}
