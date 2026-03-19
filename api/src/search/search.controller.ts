import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  ImportTmdbDto,
  SuggestQueryDto,
} from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /search?q=avengers&genre=Action&limit=20
  @Get()
  async search(@Query() dto: SearchQueryDto, @Req() req: Request) {
    return this.searchService.search(dto.q, {
      limit: dto.limit,
      page: dto.page,
      genre: dto.genre,
      type: dto.type,
      yearFrom: dto.yearFrom,
      yearTo: dto.yearTo,
      minRating: dto.minRating,
      sortBy: dto.sortBy,
      context: `${req.method} ${req.url}`,
    });
  }

  // GET /search/suggest?q=aven
  @Get('suggest')
  async suggest(@Query() dto: SuggestQueryDto, @Req() req: Request) {
    return this.searchService.suggest(dto.q, `${req.method} ${req.url}`);
  }

  // POST /search/import — user click phim TMDB → import vào DB
  @Post('import')
  async importFromTmdb(@Body() dto: ImportTmdbDto) {
    const slug = await this.searchService.importFromTmdb(dto.tmdbId);
    return { slug };
  }
}
