import { Controller, Get, Post, Query, Body } from '@nestjs/common';
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
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto.q, {
      limit: dto.limit,
      page: dto.page,
      genre: dto.genre,
      yearFrom: dto.yearFrom,
      yearTo: dto.yearTo,
      minRating: dto.minRating,
      sortBy: dto.sortBy,
    });
  }

  // GET /search/suggest?q=aven
  @Get('suggest')
  async suggest(@Query() dto: SuggestQueryDto) {
    return this.searchService.suggest(dto.q);
  }

  // POST /search/import — user click phim TMDB → import vào DB
  @Post('import')
  async importFromTmdb(@Body() dto: ImportTmdbDto) {
    const slug = await this.searchService.importFromTmdb(dto.tmdbId);
    return { slug };
  }
}
