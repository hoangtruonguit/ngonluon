import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { estypes } from '@elastic/elasticsearch';

export interface MovieDocument {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  releaseYear: number | null;
  rating: number;
  type: string;
  genres: string[];
  cast: { name: string; role: 'ACTOR' | 'DIRECTOR' }[];
}

const MOVIE_INDEX = 'movies';

interface SearchHit<T> {
  _source: T;
  _score: number;
  highlight?: Record<string, string[]>;
  inner_hits?: {
    cast?: {
      hits: {
        hits: {
          _source: { name: string; role: string };
        }[];
      };
    };
  };
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(private readonly es: NestElasticsearchService) {}

  async onModuleInit() {
    await this.createIndexIfNotExists();
  }

  // ─── Index Setup ───────────────────────────────────

  private async createIndexIfNotExists() {
    const exists = await this.es.indices.exists({ index: MOVIE_INDEX });
    if (exists) return;

    await this.es.indices.create({
      index: MOVIE_INDEX,
      settings: {
        analysis: {
          analyzer: {
            movie_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      } as estypes.IndicesIndexSettings,
      mappings: {
        properties: {
          // ── Search fields ──
          title: {
            type: 'text',
            analyzer: 'movie_analyzer',
            fields: { keyword: { type: 'keyword' } },
          },
          cast: {
            type: 'nested',
            properties: {
              name: { type: 'text', analyzer: 'movie_analyzer' },
              role: { type: 'keyword' },
            },
          },

          // ── Filter fields ──
          genres: { type: 'keyword' },
          type: { type: 'keyword' },
          language: { type: 'keyword' },
          releaseYear: { type: 'integer' },
          rating: { type: 'float' },

          // ── Display only (không index, không search) ──
          id: { type: 'keyword' },
          slug: { type: 'keyword', index: false },
          posterUrl: { type: 'keyword', index: false },
        } as Record<string, estypes.MappingProperty>,
      },
    });

    this.logger.log('Created movies index');
  }

  // ─── Index CRUD ────────────────────────────────────

  async indexMovie(doc: MovieDocument) {
    await this.es.index({
      index: MOVIE_INDEX,
      id: doc.id,
      document: doc,
    });
  }

  async indexMany(docs: MovieDocument[]) {
    if (docs.length === 0) return;

    const operations = docs.flatMap((doc) => [
      { index: { _index: MOVIE_INDEX, _id: doc.id } },
      doc,
    ]);

    const result = await this.es.bulk({ operations, refresh: true });

    if (result.errors) {
      const errors = result.items.filter((item) => {
        const entry = Object.values(item)[0];
        return (entry as { error?: unknown })?.error;
      });
      this.logger.error(`Bulk index errors: ${errors.length}`);
    }

    this.logger.log(`Indexed ${docs.length} movies`);
  }

  async removeMovie(id: string) {
    try {
      await this.es.delete({ index: MOVIE_INDEX, id });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'meta' in error &&
        (error as { meta?: { statusCode?: number } }).meta?.statusCode !== 404
      ) {
        throw error;
      }
    }
  }

  // ─── Search ────────────────────────────────────────

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
    } = {},
  ) {
    const {
      limit = 20,
      genre,
      type,
      yearFrom,
      yearTo,
      minRating,
      sortBy,
      page = 1,
    } = options;

    const filter: estypes.QueryDslQueryContainer[] = [];
    if (genre) {
      const genreList = genre.split(',').map((g) => g.trim());
      if (genreList.length === 1) {
        filter.push({ term: { genres: genreList[0] } });
      } else {
        filter.push({ terms: { genres: genreList } });
      }
    }
    if (type) filter.push({ term: { type } });

    if (yearFrom || yearTo) {
      const range: { gte?: number; lte?: number } = {};
      if (yearFrom) range.gte = yearFrom;
      if (yearTo) range.lte = yearTo;
      filter.push({ range: { releaseYear: range } });
    }

    if (minRating) {
      filter.push({ range: { rating: { gte: minRating } } });
    }

    // Sorting logic
    let sort: estypes.Sort = [];
    if (sortBy === 'newest') {
      sort = [
        { releaseYear: { order: 'desc' } },
        { _score: { order: 'desc' } },
      ];
    } else if (sortBy === 'rating') {
      sort = [{ rating: { order: 'desc' } }, { _score: { order: 'desc' } }];
    } else {
      sort = [{ _score: { order: 'desc' } }];
    }

    const from = (page - 1) * limit;

    const queryContainer: estypes.QueryDslQueryContainer = {
      bool: {
        must: [],
        filter,
      },
    };

    if (query) {
      (queryContainer.bool!.must as estypes.QueryDslQueryContainer[]).push({
        bool: {
          should: [
            // Search tên phim (boost cao nhất)
            {
              match: {
                title: {
                  query,
                  boost: 3,
                  fuzziness: 'AUTO',
                },
              },
            },
            // Search tên diễn viên / đạo diễn
            {
              nested: {
                path: 'cast',
                query: {
                  match: {
                    'cast.name': {
                      query,
                      boost: 2,
                      fuzziness: 'AUTO',
                    },
                  },
                },
                inner_hits: {
                  size: 3,
                  _source: ['cast.name', 'cast.role'],
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    } else {
      // Nếu không có query, mặc định match all (vẫn apply filters)
      (queryContainer.bool!.must as estypes.QueryDslQueryContainer[]).push({
        match_all: {},
      });
    }

    const result = await this.es.search<MovieDocument>({
      index: MOVIE_INDEX,
      size: limit,
      from,
      sort,
      query: queryContainer,
      highlight: {
        fields: {
          title: {},
        },
      },
      _source: [
        'id',
        'title',
        'slug',
        'posterUrl',
        'releaseYear',
        'rating',
        'type',
        'genres',
      ],
    });

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : (result.hits.total?.value ?? 0);

    return {
      total,
      hits: (result.hits.hits as unknown as SearchHit<MovieDocument>[]).map(
        (hit) => {
          // Lấy cast matched từ inner_hits
          const matchedCast =
            hit.inner_hits?.cast?.hits?.hits?.map((h) => h._source) ?? [];

          return {
            ...hit._source,
            score: hit._score,
            highlight: hit.highlight,
            matchedCast,
          };
        },
      ),
    };
  }

  // ─── Autocomplete ──────────────────────────────────

  async suggest(query: string, limit: number = 5) {
    const result = await this.es.search<MovieDocument>({
      index: MOVIE_INDEX,
      size: limit,
      query: {
        bool: {
          should: [
            {
              match_bool_prefix: {
                title: { query, boost: 3 },
              },
            },
            {
              nested: {
                path: 'cast',
                query: {
                  match_bool_prefix: {
                    'cast.name': { query, boost: 2 },
                  },
                },
              },
            },
          ],
        },
      } as estypes.QueryDslQueryContainer,
      _source: ['id', 'title', 'slug', 'posterUrl', 'releaseYear', 'genres'],
    });

    return result.hits.hits.map((hit) => hit._source);
  }
}
