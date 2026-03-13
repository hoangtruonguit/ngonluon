import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';

@Injectable()
export class TmdbService {
    private readonly logger = new Logger(TmdbService.name);
    private readonly baseUrl = 'https://api.themoviedb.org/3';
    private readonly apiKey: string;
    private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

    getPosterUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w780${path}` : null;
    }

    getBackdropUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w1280${path}` : null;
    }

    getAvatarUrl(path: string | null): string | null {
        return path ? `${this.imageBaseUrl}/w342${path}` : null;
    }

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('TMDB_API_KEY environment variable is not defined!');
        }
    }

    private async fetchFromTmdb(endpoint: string, params: Record<string, any> = {}) {
        if (!this.apiKey) {
            throw new Error('Missing TMDB API key.');
        }

        try {
            const response = await firstValueFrom<AxiosResponse<any>>(
                this.httpService.get(`${this.baseUrl}${endpoint}`, {
                    params: {
                        api_key: this.apiKey,
                        ...params,
                    },
                }),
            );
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to fetch from TMDB endpoint: ${endpoint}`, error.message);
            throw error;
        }
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    }

    async seedGenres() {
        this.logger.log('Starting TMDB genres seed');
        const data = await this.fetchFromTmdb('/genre/movie/list');

        if (!data || !data.genres) return;

        let count = 0;
        for (const genre of data.genres) {
            const slug = genre.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            await this.prisma.genre.upsert({
                where: { id: genre.id },
                update: {
                    name: genre.name,
                },
                create: {
                    id: genre.id,
                    name: genre.name,
                    slug: slug,
                },
            });
            count++;
        }
        this.logger.log(`Successfully seeded ${count} genres.`);
    }

    async seedPopularMovies(pages: number = 1) {
        this.logger.log(`Starting TMDB popular movies seed for ${pages} pages`);

        for (let page = 1; page <= pages; page++) {
            this.logger.log(`Fetching page ${page}...`);
            const data = await this.fetchFromTmdb('/movie/top_rated', { page });
            if (!data || !data.results) continue;

            for (const item of data.results) {
                try {
                    const existingMovie = await this.prisma.movie.findFirst({
                        where: { title: item.title }
                    });

                    if (existingMovie) {
                        this.logger.debug(`Movie ${item.title} already exists.`);
                        continue;
                    }

                    const movie = await this.prisma.movie.create({
                        data: {
                            title: item.title,
                            slug: this.generateSlug(item.title),
                            description: item.overview,
                            posterUrl: this.getPosterUrl(item.poster_path),
                            thumbnailUrl: this.getBackdropUrl(item.backdrop_path),
                            releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : null,
                            rating: item.vote_average,
                            type: 'MOVIE',
                        }
                    });

                    if (item.genre_ids && item.genre_ids.length > 0) {
                        for (const gId of item.genre_ids) {
                            const genreExists = await this.prisma.genre.findUnique({ where: { id: gId } });
                            if (genreExists) {
                                await this.prisma.movieGenre.create({
                                    data: {
                                        movieId: movie.id,
                                        genreId: gId
                                    }
                                });
                            }
                        }
                    }

                    await this.seedMovieDetails(item.id, movie.id);
                    this.logger.debug(`Imported movie: ${item.title}`);
                } catch (error: any) {
                    this.logger.error(`Error processing movie ${item.title}: ${error.message}`);
                }
            }
        }
        this.logger.log(`Finished seeding popular movies.`);
    }

    private async seedMovieDetails(tmdbId: number, internalMovieId: string) {
        try {
            const details = await this.fetchFromTmdb(`/movie/${tmdbId}`);
            const trailerUrl = await this.getVideoUrl(tmdbId);

            if (details.runtime) {
                await this.prisma.movie.update({
                    where: { id: internalMovieId },
                    data: {
                        durationMinutes: details.runtime || null,
                        trailerUrl,
                    },
                });
            }

            const credits = await this.fetchFromTmdb(`/movie/${tmdbId}/credits`);

            if (credits.cast) {
                for (const castMember of credits.cast.slice(0, 10)) {
                    const person = await this.upsertPerson(castMember);
                    await this.prisma.cast.create({
                        data: {
                            movieId: internalMovieId,
                            personId: person.id,
                            characterName: castMember.character,
                            role: 'ACTOR'
                        }
                    });
                }
            }

            if (credits.crew) {
                const director = credits.crew.find(c => c.job === 'Director');
                if (director) {
                    const person = await this.upsertPerson(director);
                    await this.prisma.cast.create({
                        data: {
                            movieId: internalMovieId,
                            personId: person.id,
                            role: 'DIRECTOR'
                        }
                    });
                }
            }
        } catch (error: any) {
            this.logger.warn(`Failed to seed details for tmdbId ${tmdbId}: ${error.message}`);
        }
    }

    private async upsertPerson(tmdbPerson: any) {
        let person = await this.prisma.person.findFirst({
            where: { name: tmdbPerson.name }
        });

        if (!person) {
            person = await this.prisma.person.create({
                data: {
                    name: tmdbPerson.name,
                    avatarUrl: this.getAvatarUrl(tmdbPerson.profile_path),
                }
            });
        }
        return person;
    }

    private async getVideoUrl(tmdbId: number): Promise<string | null> {
        try {
            const videos = await this.fetchFromTmdb(`/movie/${tmdbId}/videos`);
            if (!videos.results?.length) return null;

            // Ưu tiên theo thứ tự: Trailer → Teaser → Clip → bất kỳ
            const priority = ['Trailer', 'Teaser', 'Clip'];

            for (const type of priority) {
                const video = videos.results.find(
                    (v: any) => v.type === type && v.site === 'YouTube'
                );
                if (video) return `https://www.youtube.com/embed/${video.key}`;
            }

            const anyYoutube = videos.results.find(
                (v: any) => v.site === 'YouTube'
            );
            if (anyYoutube) return `https://www.youtube.com/embed/${anyYoutube.key}`;

            return null;
        } catch {
            return null;
        }
    }

    async seedMissingTrailers() {
        this.logger.log('Starting missing trailers seed...');
        
        const moviesWithoutTrailers = await this.prisma.movie.findMany({
            where: {
                OR: [
                    { trailerUrl: null },
                    { trailerUrl: '' }
                ],
                type: 'MOVIE'
            }
        });

        this.logger.log(`Found ${moviesWithoutTrailers.length} movies without a trailer.`);

        let count = 0;
        for (const movie of moviesWithoutTrailers) {
            try {
                let trailerUrlToSave = 'https://www.youtube.com/embed/ysz5S6PUM-U'; // Default placeholder trailer
                let foundOnTmdb = false;

                // Search TMDB by title to find the TMDB ID
                const searchResults = await this.fetchFromTmdb('/search/movie', {
                    query: movie.title,
                    ...(movie.releaseYear && { primary_release_year: movie.releaseYear })
                });

                if (searchResults.results && searchResults.results.length > 0) {
                    const bestMatch = searchResults.results[0]; // Take the first match
                    const tmdbId = bestMatch.id;

                    const tmdbTrailerUrl = await this.getVideoUrl(tmdbId);
                    if (tmdbTrailerUrl) {
                        trailerUrlToSave = tmdbTrailerUrl;
                        foundOnTmdb = true;
                    } else {
                        this.logger.debug(`No Youtube trailer found on TMDB for movie: ${movie.title} (TMDB ID: ${tmdbId})`);
                    }
                } else {
                    this.logger.warn(`Could not find TMDB match for movie: ${movie.title}`);
                }

                await this.prisma.movie.update({
                    where: { id: movie.id },
                    data: { trailerUrl: trailerUrlToSave }
                });
                count++;
                
                if (foundOnTmdb) {
                    this.logger.debug(`Updated TMDB trailer for movie: ${movie.title}`);
                } else {
                    this.logger.debug(`Assigned default trailer for movie: ${movie.title}`);
                }
            } catch (error: any) {
                this.logger.error(`Error processing trailer for ${movie.title}: ${error.message}`);
            }
            
            // Adding a small delay to avoid hitting TMDB rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.logger.log(`Successfully updated trailers for ${count} movies.`);
    }
}
