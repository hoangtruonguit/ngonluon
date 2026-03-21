import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { TmdbService, TmdbMovie } from '../tmdb/tmdb.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { TmdbImportProducer } from '../tmdb/tmdb-import.producer';

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
    private readonly rabbitMQService: RabbitMQService,
    private readonly TmdbImportProducer: TmdbImportProducer,
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
    const MIN_LOCAL_RESULTS = 40;

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

    // 2. Nếu ES ít kết quả (total < 40) hoặc không có -> fallback TMDB (chỉ khi có query)
    if (query && total < MIN_LOCAL_RESULTS) {
      const remaining = limit - results.length;

      // Lấy thêm local key để dedup (tránh trùng phim ở trang khác)
      const allLocalResult = await this.esService.search(query, {
        ...options,
        limit: MIN_LOCAL_RESULTS,
        page: 1,
      });

      const tmdbData = await this.searchTmdb(
        query,
        remaining,
        allLocalResult.hits,
        page,
      );
      results.push(...tmdbData.results);
      // Nếu local không có gì, lấy total từ TMDB để pagination hoạt động
      if (total === 0) {
        total = tmdbData.total;
      }

      // Fire-and-forget: queue TMDB movies for background import
      if (tmdbData.results.length) {
        const tmdbIds = tmdbData.results
          .filter((item) => item.source === 'tmdb' && item.tmdbId)
          .map((item) => item.tmdbId!);

        if (tmdbIds.length) {
          await this.TmdbImportProducer.importBatchQueue(tmdbIds);
        }
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
    existingHits: any[],
    page: number,
  ): Promise<{ results: SearchResult[]; total: number }> {
    try {
      const tmdbData = await this.tmdbService.searchMovies(query, page);
      if (!tmdbData?.results) return { results: [], total: 0 };

      // Dedup bằng title + releaseYear để tránh trùng phim cùng tên khác năm
      const existingKeys = new Set(
        existingHits.map(
          (r: { title: string; releaseYear?: number | null }) => {
            const year = r.releaseYear ?? '';
            return `${r.title.toLowerCase()}::${year}`;
          },
        ),
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
