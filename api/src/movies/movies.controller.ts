import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { CreateCommentDto } from './dto/comment.dto';
import { CreateReviewDto } from './dto/review.dto';
import { SearchQueryDto } from '../common/dto/search-query.dto';

interface UserPayload {
  id?: string;
  userId?: string;
  email: string;
}

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('trending')
  async getTrending(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.moviesService.getTrendingMovies(parsedLimit);
  }

  @Get('new-releases')
  async getNewReleases(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.moviesService.getNewReleases(parsedLimit);
  }

  @Get('now-playing')
  async getNowPlaying(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.moviesService.getNowPlayingMovies(parsedLimit);
  }

  @Get('genres')
  async getGenres() {
    return this.moviesService.getGenres();
  }

  @Get('search')
  async searchMovies(@Query() query: SearchQueryDto) {
    return this.moviesService.searchMovies(query);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const movie = await this.moviesService.getMovieBySlug(slug);
    if (!movie) {
      throw new NotFoundException(`Movie with slug "${slug}" not found`);
    }
    return movie;
  }

  @Get(':slug/similar')
  async getSimilar(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.moviesService.getSimilarMovies(slug, parsedLimit);
  }

  @Post(':movieId/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('movieId') movieId: string,
    @User() user: UserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    // the decorator may return payload with user.id or user.userId depending on token strategy
    const userId = user.userId || user.id;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.moviesService.addComment(userId, movieId, dto);
  }

  @Post(':movieId/reviews')
  @UseGuards(JwtAuthGuard)
  async addReview(
    @Param('movieId') movieId: string,
    @User() user: UserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = user.userId || user.id;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.moviesService.addReview(userId, movieId, dto);
  }

  @Get(':movieId/reviews')
  async getReviews(
    @Param('movieId') movieId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    const parsedTake = take ? parseInt(take, 10) : 20;
    return this.moviesService.getReviewsByMovie(
      movieId,
      parsedSkip,
      parsedTake,
    );
  }

  @Get(':movieId/comments')
  async getComments(
    @Param('movieId') movieId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const parsedSkip = skip ? parseInt(skip, 10) : 0;
    const parsedTake = take ? parseInt(take, 10) : 20;
    return this.moviesService.getCommentsByMovie(
      movieId,
      parsedSkip,
      parsedTake,
    );
  }
}
