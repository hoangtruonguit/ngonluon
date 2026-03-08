import { Controller, Get, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) { }

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

    @Get('genres')
    async getGenres() {
        return this.moviesService.getGenres();
    }
}
