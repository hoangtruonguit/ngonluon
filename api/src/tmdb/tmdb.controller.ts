import { Controller, Post, Query, Logger, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TmdbService } from './tmdb.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('TMDB')
@ApiBearerAuth()
@Controller('tmdb')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TmdbController {
  private readonly logger = new Logger(TmdbController.name);

  constructor(private readonly tmdbService: TmdbService) {}

  @Post('crawl-genres')
  async crawlGenres() {
    this.logger.log('Manually triggered TMDB genre crawl');
    await this.tmdbService.seedGenres();
    return { message: 'Genre crawl started. Check server logs.' };
  }

  @Post('crawl-popular')
  async crawlPopularMovies(@Query('pages') pages: string = '1') {
    const pageCount = parseInt(pages, 10);
    this.logger.log(
      `Manually triggered TMDB popular movies crawl for ${pageCount} pages`,
    );
    await this.tmdbService.seedPopularMovies(pageCount);
    return {
      message: `Popular movies crawl started for ${pageCount} pages. Check server logs.`,
    };
  }
}
