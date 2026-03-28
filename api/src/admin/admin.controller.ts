import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MoviesRepository } from '../movies/movies.repository';
import { TmdbService } from '../tmdb/tmdb.service';
import { CreateMovieDto, UpdateMovieDto } from './dto/admin-movie.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly moviesRepository: MoviesRepository,
    private readonly tmdbService: TmdbService,
  ) {}

  // ─── Movies CRUD ─────────────────────────────────────

  @Get('movies')
  async listMovies(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const [movies, totalCount] = await Promise.all([
      this.moviesRepository.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.moviesRepository.count(),
    ]);

    return {
      data: movies,
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
      },
    };
  }

  @Get('movies/:id')
  async getMovie(@Param('id') id: string) {
    const movie = await this.moviesRepository.findById(id);
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }

  @Post('movies')
  async createMovie(@Body() dto: CreateMovieDto) {
    const slug = this.generateSlug(dto.title);
    const movie = await this.moviesRepository.create({
      title: dto.title,
      slug,
      description: dto.description,
      posterUrl: dto.posterUrl,
      thumbnailUrl: dto.thumbnailUrl,
      releaseYear: dto.releaseYear,
      rating: dto.rating ?? 0,
      durationMinutes: dto.durationMinutes,
      trailerUrl: dto.trailerUrl,
      type: dto.type,
    });
    this.logger.log(`Admin created movie: ${movie.title}`);
    return movie;
  }

  @Patch('movies/:id')
  async updateMovie(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    const existing = await this.moviesRepository.findById(id);
    if (!existing) throw new NotFoundException('Movie not found');

    const movie = await this.moviesRepository.update(id, dto);
    this.logger.log(`Admin updated movie: ${movie.title}`);
    return movie;
  }

  @Delete('movies/:id')
  async deleteMovie(@Param('id') id: string) {
    const existing = await this.moviesRepository.findById(id);
    if (!existing) throw new NotFoundException('Movie not found');

    await this.moviesRepository.delete(id);
    this.logger.log(`Admin deleted movie: ${existing.title}`);
    return { message: 'Movie deleted' };
  }

  // ─── TMDB Crawl ──────────────────────────────────────

  @Post('crawl/genres')
  async crawlGenres() {
    this.logger.log('Admin triggered TMDB genre crawl');
    await this.tmdbService.seedGenres();
    return { message: 'Genre crawl completed' };
  }

  @Post('crawl/popular')
  async crawlPopularMovies(@Query('pages') pages: string = '1') {
    const pageCount = Math.min(parseInt(pages, 10) || 1, 50);
    this.logger.log(`Admin triggered TMDB popular crawl: ${pageCount} pages`);
    await this.tmdbService.seedPopularMovies(pageCount);
    return { message: `Popular movies crawl completed for ${pageCount} pages` };
  }

  @Post('crawl/trailers')
  async crawlMissingTrailers() {
    this.logger.log('Admin triggered missing trailers crawl');
    await this.tmdbService.seedMissingTrailers();
    return { message: 'Missing trailers crawl completed' };
  }

  // ─── Helpers ─────────────────────────────────────────

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4)
    );
  }
}
