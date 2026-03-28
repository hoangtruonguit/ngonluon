import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  ImportTmdbDto,
  SuggestQueryDto,
} from './dto/search-query.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /search?q=avengers&genre=Action&limit=20
  @Get()
  @ApiOperation({ summary: 'Full-text search movies with Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Search results' })
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
  @ApiOperation({ summary: 'Autocomplete search suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestion results' })
  async suggest(@Query() dto: SuggestQueryDto, @Req() req: Request) {
    return this.searchService.suggest(dto.q, `${req.method} ${req.url}`);
  }

  // POST /search/import
  @Post('import')
  @ApiOperation({ summary: 'Import a movie from TMDB into the database' })
  @ApiResponse({ status: 201, description: 'Movie imported successfully' })
  async importFromTmdb(@Body() dto: ImportTmdbDto) {
    const slug = await this.searchService.importFromTmdb(dto.tmdbId);
    return { slug };
  }
}
