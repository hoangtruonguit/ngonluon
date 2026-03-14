import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';

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

@Injectable()
export class ElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(ElasticsearchService.name);

    constructor(private readonly es: NestElasticsearchService) { }

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
            } as any,
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
                } as any,
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
            const errors = result.items.filter((item: any) => item.index?.error);
            this.logger.error(`Bulk index errors: ${errors.length}`);
        }

        this.logger.log(`Indexed ${docs.length} movies`);
    }

    async removeMovie(id: string) {
        try {
            await this.es.delete({ index: MOVIE_INDEX, id });
        } catch (error: any) {
            if (error.meta?.statusCode !== 404) throw error;
        }
    }

    // ─── Search ────────────────────────────────────────

    async search(query: string, options: { 
        limit?: number; 
        genre?: string; 
        type?: string;
        yearFrom?: number;
        yearTo?: number;
        minRating?: number;
        sortBy?: string;
        page?: number;
    } = {}) {
        const { limit = 20, genre, type, yearFrom, yearTo, minRating, sortBy, page = 1 } = options;

        const filter: any[] = [];
        if (genre) filter.push({ term: { genres: genre } });
        if (type) filter.push({ term: { type } });
        
        if (yearFrom || yearTo) {
            const range: any = {};
            if (yearFrom) range.gte = yearFrom;
            if (yearTo) range.lte = yearTo;
            filter.push({ range: { releaseYear: range } });
        }

        if (minRating) {
            filter.push({ range: { rating: { gte: minRating } } });
        }

        // Sorting logic
        let sort: any = [];
        if (sortBy === 'newest') {
            sort = [{ releaseYear: { order: 'desc' } }, { _score: { order: 'desc' } }];
        } else if (sortBy === 'rating') {
            sort = [{ rating: { order: 'desc' } }, { _score: { order: 'desc' } }];
        } else {
            sort = [{ _score: { order: 'desc' } }];
        }

        const from = (page - 1) * limit;

        const result = await this.es.search({
            index: MOVIE_INDEX,
            size: limit,
            from,
            sort,
            query: {
                bool: {
                    must: [
                        {
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
                        },
                    ],
                    filter,
                },
            } as any,
            highlight: {
                fields: {
                    title: {},
                },
            },
            _source: ['id', 'title', 'slug', 'posterUrl', 'releaseYear', 'rating', 'type', 'genres'],
        });

        return {
            total: (result.hits.total as any)?.value ?? 0,
            hits: result.hits.hits.map((hit: any) => {
                // Lấy cast matched từ inner_hits
                const matchedCast = hit.inner_hits?.cast?.hits?.hits?.map(
                    (h: any) => h._source,
                ) ?? [];

                return {
                    ...hit._source,
                    score: hit._score,
                    highlight: hit.highlight,
                    matchedCast,
                };
            }),
        };
    }

    // ─── Autocomplete ──────────────────────────────────

    async suggest(query: string, limit: number = 5) {
        const result = await this.es.search({
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
            } as any,
            _source: ['id', 'title', 'slug', 'posterUrl', 'releaseYear', 'genres'],
        });

        return result.hits.hits.map((hit: any) => hit._source);
    }
}