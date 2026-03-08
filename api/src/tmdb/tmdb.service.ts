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
    private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

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

    // Helper functions here...
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
                    id: genre.id, // Keep TMDB ID
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
            const data = await this.fetchFromTmdb('/movie/popular', { page });
            if (!data || !data.results) continue;

            for (const item of data.results) {
                try {
                    // Check if movie already exists (TMDB ID isn't directly the UUID, 
                    // but we could store TMDB ID, or just check by title/release date.
                    // Let's see if we can just create if not found by title. 
                    // To be safe, we'll try to find by title. 
                    const existingMovie = await this.prisma.movie.findFirst({
                        where: { title: item.title }
                    });

                    if (existingMovie) {
                        this.logger.debug(`Movie ${item.title} already exists.`);
                        continue;
                    }

                    // Create the movie initially
                    const movie = await this.prisma.movie.create({
                        data: {
                            title: item.title,
                            slug: this.generateSlug(item.title),
                            description: item.overview,
                            posterUrl: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : null,
                            thumbnailUrl: item.backdrop_path ? `${this.imageBaseUrl}${item.backdrop_path}` : null,
                            releaseYear: item.release_date ? parseInt(item.release_date.split('-')[0], 10) : null,
                            rating: item.vote_average,
                            type: 'MOVIE',
                        }
                    });

                    // Associate genres
                    if (item.genre_ids && item.genre_ids.length > 0) {
                        for (const gId of item.genre_ids) {
                            // ensure genre exists first
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

                    // Fetch details like runtime and cast
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
            // Get detailed info
            const details = await this.fetchFromTmdb(`/movie/${tmdbId}`);
            if (details.runtime) {
                await this.prisma.movie.update({
                    where: { id: internalMovieId },
                    data: { durationMinutes: details.runtime }
                });
            }

            // Get cast & crew
            const credits = await this.fetchFromTmdb(`/movie/${tmdbId}/credits`);

            if (credits.cast) {
                // limit to top 10 cast to save db space
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
        // TMDB provides IDs for people too. Since Person doesn't have tmdbId, we match by name for simplicity
        // or we can just try to find by name.
        let person = await this.prisma.person.findFirst({
            where: { name: tmdbPerson.name }
        });

        if (!person) {
            person = await this.prisma.person.create({
                data: {
                    name: tmdbPerson.name,
                    avatarUrl: tmdbPerson.profile_path ? `${this.imageBaseUrl}${tmdbPerson.profile_path}` : null,
                    // TMDB doesn't return bio in credits, would need separate call /person/{id}
                }
            });
        }
        return person;
    }
}
