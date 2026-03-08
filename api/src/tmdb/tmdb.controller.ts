import { Controller, Post, Query, Logger } from '@nestjs/common';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
    private readonly logger = new Logger(TmdbController.name);

    constructor(private readonly tmdbService: TmdbService) { }

    @Post('crawl-genres')
    async crawlGenres() {
        this.logger.log('Manually triggered TMDB genre crawl');
        await this.tmdbService.seedGenres();
        return { message: 'Genre crawl started. Check server logs.' };
    }

    @Post('crawl-popular')
    async crawlPopularMovies(@Query('pages') pages: string = '1') {
        const pageCount = parseInt(pages, 10);
        this.logger.log(`Manually triggered TMDB popular movies crawl for ${pageCount} pages`);
        await this.tmdbService.seedPopularMovies(pageCount);
        return { message: `Popular movies crawl started for ${pageCount} pages. Check server logs.` };
    }
}
