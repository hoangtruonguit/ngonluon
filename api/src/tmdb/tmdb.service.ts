import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { MoviesRepository } from '../movies/movies.repository';

@Injectable()
export class TmdbService {
    private readonly logger = new Logger(TmdbService.name);
    private readonly baseUrl = 'https://api.themoviedb.org/3';
    private readonly apiKey: string;
    private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

    constructor(
        private readonly httpService: HttpService,
        private readonly moviesRepository: MoviesRepository,
        private readonly configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('TMDB_API_KEY environment variable is not defined!');
        }
    }

    // ─── Image URL Helpers ─────────────────────────────

    getPosterUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w780${path}` : null;
    }

    getBackdropUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w1280${path}` : null;
    }

    getAvatarUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w342${path}` : null;
    }

    // ─── TMDB API Client ───────────────────────────────

    private async fetchFromTmdb(endpoint: string, params: Record<string, any> = {}) {
        if (!this.apiKey) {
            throw new Error('Missing TMDB API key.');
        }

        try {
            const response = await firstValueFrom<AxiosResponse<any>>(
                this.httpService.get(`${this.baseUrl}${endpoint}`, {
                    params: { api_key: this.apiKey, ...params },
                }),
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to fetch from TMDB: ${endpoint}`, error.message);
            throw error;
        }
    }

    // ─── Search (cho fallback search) ──────────────────

    async searchMovies(query: string, page: number = 1) {
        return this.fetchFromTmdb('/search/movie', { query, page });
    }

    // ─── Import Single Movie (cho user click TMDB result) ──

    async importSingleMovie(tmdbId: number): Promise<string> {
        const details = await this.fetchFromTmdb(`/movie/${tmdbId}`);

        // Check đã tồn tại chưa
        const existing = await this.moviesRepository.findByTitle(details.title);
        if (existing) return existing.slug;

        const slug = this.generateSlug(details.title);
        const trailerUrl = await this.getVideoUrl(tmdbId);

        // Create movie → repository emit 'movie.created' → ES sync
        const movie = await this.moviesRepository.create({
            title: details.title,
            slug,
            description: details.overview,
            posterUrl: this.getPosterUrl(details.poster_path),
            thumbnailUrl: this.getBackdropUrl(details.backdrop_path),
            releaseYear: details.release_date
                ? parseInt(details.release_date.split('-')[0], 10)
                : null,
            rating: details.vote_average,
            durationMinutes: details.runtime,
            trailerUrl,
            type: 'MOVIE',
        });

        // Sync genres
        if (details.genres) {
            for (const genre of details.genres) {
                const genreSlug = this.generateGenreSlug(genre.name);
                await this.moviesRepository.upsertGenre({ id: genre.id, name: genre.name, slug: genreSlug });
                await this.moviesRepository.addGenreToMovie(movie.id, genre.id);
            }
        }

        // Sync cast
        await this.seedMovieCredits(tmdbId, movie.id);

        this.logger.log(`Imported from TMDB: ${details.title}`);
        return slug;
    }

    // ─── Seed: Genres ──────────────────────────────────

    async seedGenres() {
        this.logger.log('Starting TMDB genres seed');
        const data = await this.fetchFromTmdb('/genre/movie/list');
        if (!data?.genres) return;

        let count = 0;
        for (const genre of data.genres) {
            const slug = this.generateGenreSlug(genre.name);
            await this.moviesRepository.upsertGenre({ id: genre.id, name: genre.name, slug });
            count++;
        }

        this.logger.log(`Successfully seeded ${count} genres.`);
    }

    // ─── Seed: Popular Movies ──────────────────────────

    async seedPopularMovies(pages: number = 1) {
        this.logger.log(`Starting TMDB popular movies seed for ${pages} pages`);

        for (let page = 1; page <= pages; page++) {
            this.logger.log(`Fetching page ${page}...`);
            const data = await this.fetchFromTmdb('/movie/top_rated', { page });
            if (!data?.results) continue;

            for (const item of data.results) {
                try {
                    await this.importMovieFromList(item);
                } catch (error: any) {
                    this.logger.error(`Error processing movie ${item.title}: ${error.message}`);
                }
            }
        }

        this.logger.log('Finished seeding popular movies.');
    }

    // ─── Seed: Missing Trailers ────────────────────────

    async seedMissingTrailers() {
        this.logger.log('Starting missing trailers seed...');

        const moviesWithoutTrailers = await this.moviesRepository.findMany({
            where: {
                OR: [{ trailerUrl: null }, { trailerUrl: '' }],
                type: 'MOVIE',
            },
            take: 10000, // lấy hết
        });

        this.logger.log(`Found ${moviesWithoutTrailers.length} movies without a trailer.`);

        const DEFAULT_TRAILER = 'https://www.youtube.com/embed/ysz5S6PUM-U';
        let count = 0;

        for (const movie of moviesWithoutTrailers) {
            try {
                const trailerUrl = await this.findTrailerForMovie(movie.title, movie.releaseYear);

                // Update → repository emit 'movie.updated' → ES sync
                await this.moviesRepository.update(movie.id, {
                    trailerUrl: trailerUrl || DEFAULT_TRAILER,
                });

                count++;
                this.logger.debug(
                    trailerUrl
                        ? `Updated TMDB trailer for: ${movie.title}`
                        : `Assigned default trailer for: ${movie.title}`,
                );
            } catch (error: any) {
                this.logger.error(`Error processing trailer for ${movie.title}: ${error.message}`);
            }

            // Rate limit protection
            await this.delay(200);
        }

        this.logger.log(`Successfully updated trailers for ${count} movies.`);
    }

    // ─── Private: Import từ list item ──────────────────

    private async importMovieFromList(item: any) {
        // Check trùng
        const existing = await this.moviesRepository.findByTitle(item.title);
        if (existing) {
            this.logger.debug(`Movie ${item.title} already exists.`);
            return;
        }

        // Create movie → repository emit 'movie.created' → ES sync
        const movie = await this.moviesRepository.create({
            title: item.title,
            slug: this.generateSlug(item.title),
            description: item.overview,
            posterUrl: this.getPosterUrl(item.poster_path),
            thumbnailUrl: this.getBackdropUrl(item.backdrop_path),
            releaseYear: item.release_date
                ? parseInt(item.release_date.split('-')[0], 10)
                : null,
            rating: item.vote_average,
            type: 'MOVIE',
        });

        // Link genres
        if (item.genre_ids?.length > 0) {
            for (const genreId of item.genre_ids) {
                const genreExists = await this.moviesRepository.findGenreById(genreId);
                if (genreExists) {
                    await this.moviesRepository.addGenreToMovie(movie.id, genreId);
                }
            }
        }

        // Seed details (duration, trailer, cast)
        await this.seedMovieDetails(item.id, movie.id);

        this.logger.debug(`Imported movie: ${item.title}`);
    }

    // ─── Private: Seed movie details ───────────────────

    private async seedMovieDetails(tmdbId: number, movieId: string) {
        try {
            const details = await this.fetchFromTmdb(`/movie/${tmdbId}`);
            const trailerUrl = await this.getVideoUrl(tmdbId);

            // Update → repository emit 'movie.updated' → ES sync
            await this.moviesRepository.update(movieId, {
                durationMinutes: details.runtime || null,
                trailerUrl,
            });

            await this.seedMovieCredits(tmdbId, movieId);
        } catch (error: any) {
            this.logger.warn(`Failed to seed details for tmdbId ${tmdbId}: ${error.message}`);
        }
    }

    // ─── Private: Seed credits (cast + director) ───────

    private async seedMovieCredits(tmdbId: number, movieId: string) {
        try {
            const credits = await this.fetchFromTmdb(`/movie/${tmdbId}/credits`);

            // Top 10 actors
            if (credits.cast) {
                for (const member of credits.cast.slice(0, 10)) {
                    const person = await this.moviesRepository.upsertPerson(
                        member.name,
                        this.getAvatarUrl(member.profile_path),
                    );
                    await this.moviesRepository.addCast({
                        movieId,
                        personId: person.id,
                        characterName: member.character,
                        role: 'ACTOR',
                    });
                }
            }

            // Director
            if (credits.crew) {
                const director = credits.crew.find((c: any) => c.job === 'Director');
                if (director) {
                    const person = await this.moviesRepository.upsertPerson(
                        director.name,
                        this.getAvatarUrl(director.profile_path),
                    );
                    await this.moviesRepository.addCast({
                        movieId,
                        personId: person.id,
                        role: 'DIRECTOR',
                    });
                }
            }
        } catch (error: any) {
            this.logger.warn(`Failed to seed credits for tmdbId ${tmdbId}: ${error.message}`);
        }
    }

    // ─── Private: Find trailer by title ────────────────

    private async findTrailerForMovie(
        title: string,
        releaseYear: number | null,
    ): Promise<string | null> {
        const searchResults = await this.fetchFromTmdb('/search/movie', {
            query: title,
            ...(releaseYear && { primary_release_year: releaseYear }),
        });

        if (!searchResults.results?.length) {
            this.logger.warn(`Could not find TMDB match for: ${title}`);
            return null;
        }

        const tmdbId = searchResults.results[0].id;
        const trailerUrl = await this.getVideoUrl(tmdbId);

        if (!trailerUrl) {
            this.logger.debug(`No YouTube trailer found for: ${title} (TMDB ID: ${tmdbId})`);
        }

        return trailerUrl;
    }

    // ─── Private: Get YouTube trailer URL ──────────────

    private async getVideoUrl(tmdbId: number): Promise<string | null> {
        try {
            const videos = await this.fetchFromTmdb(`/movie/${tmdbId}/videos`);
            if (!videos.results?.length) return null;

            const priority = ['Trailer', 'Teaser', 'Clip'];

            for (const type of priority) {
                const video = videos.results.find(
                    (v: any) => v.type === type && v.site === 'YouTube',
                );
                if (video) return `https://www.youtube.com/embed/${video.key}`;
            }

            const anyYoutube = videos.results.find((v: any) => v.site === 'YouTube');
            return anyYoutube ? `https://www.youtube.com/embed/${anyYoutube.key}` : null;
        } catch {
            return null;
        }
    }

    // ─── Private: Helpers ──────────────────────────────

    private generateSlug(title: string): string {
        return (
            title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '') +
            '-' +
            Date.now().toString().slice(-4)
        );
    }

    private generateGenreSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}