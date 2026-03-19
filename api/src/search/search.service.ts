import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { TmdbService, TmdbMovie } from '../tmdb/tmdb.service';
import { SyncService } from '../elasticsearch/sync.service';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  source: 'local' | 'tmdb';
  id: string;
  tmdbId?: number;
  title: string;
  slug?: string;
  posterUrl: string | null;
  releaseYear: number | null;
  rating: number;
  description?: string;
  genres: string[];
  highlight?: Record<string, string[]>;
  matchedCast?: { name: string; role: string }[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly tmdbService: TmdbService,
    private readonly syncService: SyncService,
    private readonly prisma: PrismaService,
  ) {}

  async search(
    query?: string,
    options: {
      limit?: number;
      genre?: string;
      type?: string;
      yearFrom?: number;
      yearTo?: number;
      minRating?: number;
      sortBy?: string;
      page?: number;
      context?: string;
    } = {},
  ) {
    const { limit = 20, page = 1 } = options;
    const MIN_LOCAL_RESULTS = 5;

    // 1. Search ES trước
    const esResult = await this.esService.search(query, options);

    let total = esResult.total;
    const results: SearchResult[] = esResult.hits.map((hit) => ({
      source: 'local' as const,
      id: hit.id,
      title: hit.title,
      slug: hit.slug,
      posterUrl: hit.posterUrl,
      releaseYear: hit.releaseYear,
      rating: hit.rating,
      genres: hit.genres,
      description: (hit as { description?: string }).description,
      highlight: hit.highlight,
    }));

    // 2. Nếu ES ít kết quả (< 5) hoặc không có -> fallback TMDB (chỉ khi có query)
    if (query && results.length < MIN_LOCAL_RESULTS) {
      const remaining = limit - results.length;
      const tmdbData = await this.searchTmdb(query, remaining, results, page);
      results.push(...tmdbData.results);
      // Nếu local không có gì, lấy total từ TMDB để pagination hoạt động
      if (total === 0) {
        total = tmdbData.total;
      }
    }

    return {
      total,
      results,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async suggest(query: string, context?: string) {
    return this.esService.suggest(query, 5, context);
  }

  // ─── TMDB Fallback ─────────────────────────────────
  private async searchTmdb(
    query: string,
    limit: number,
    existingResults: SearchResult[],
    page: number,
  ): Promise<{ results: SearchResult[]; total: number }> {
    try {
      const tmdbData = await this.tmdbService.searchMovies(query, page);
      if (!tmdbData?.results) return { results: [], total: 0 };

      // Dedup bằng title + releaseYear để tránh trùng phim cùng tên khác năm
      const existingKeys = new Set(
        existingResults.map((r) => {
          const year = r.releaseYear ?? '';
          return `${r.title.toLowerCase()}::${year}`;
        }),
      );

      const mappedResults = tmdbData.results
        .filter((item: TmdbMovie) => {
          const year = item.release_date
            ? parseInt(item.release_date.split('-')[0], 10)
            : '';
          return !existingKeys.has(`${item.title?.toLowerCase()}::${year}`);
        })
        .slice(0, limit)
        .map((item: TmdbMovie) => ({
          source: 'tmdb' as const,
          id: `tmdb-${item.id}`,
          tmdbId: item.id,
          title: item.title,
          posterUrl: this.tmdbService.getPosterUrl(item.poster_path),
          releaseYear: item.release_date
            ? parseInt(item.release_date.split('-')[0], 10)
            : null,
          rating: item.vote_average ?? 0,
          description: item.overview,
          genres: [], // TMDB search chỉ trả genre_ids
        }));

      return {
        results: mappedResults,
        total: tmdbData.total_results,
      };
    } catch (error) {
      this.logger.warn(`TMDB search failed: ${error}`);
      return { results: [], total: 0 };
    }
  }

  // ─── Import TMDB movie khi user click ──────────────
  async importFromTmdb(tmdbId: number): Promise<string> {
    // Dùng logic crawl đã có trong TmdbService
    const slug = await this.tmdbService.importSingleMovie(tmdbId);
    return slug;
  }
}
