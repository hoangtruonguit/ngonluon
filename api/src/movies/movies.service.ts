import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MoviesService {
    constructor(private prisma: PrismaService) { }

    async getTrendingMovies(limit: number = 20) {
        // Here we just order by rating to simulate "trending"
        // In reality, this could be ordered by popularity or views
        const movies = await this.prisma.movie.findMany({
            orderBy: {
                rating: 'desc',
            },
            take: limit,
            include: {
                genres: {
                    include: {
                        genre: true,
                    },
                },
            },
        });

        return movies.map((movie) => this.mapMovieResponse(movie));
    }

    async getNewReleases(limit: number = 20) {
        // Order by releaseYear desc to get newest 
        // fallback to createdAt desc
        const movies = await this.prisma.movie.findMany({
            orderBy: [
                { releaseYear: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            include: {
                genres: {
                    include: {
                        genre: true,
                    },
                },
            },
        });

        return movies.map((movie) => this.mapMovieResponse(movie));
    }

    async getGenres() {
        return this.prisma.genre.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }

    private mapMovieResponse(movie: any) {
        return {
            id: movie.id,
            title: movie.title,
            slug: movie.slug,
            description: movie.description,
            posterUrl: movie.posterUrl,
            thumbnailUrl: movie.thumbnailUrl,
            trailerUrl: movie.trailerUrl,
            releaseYear: movie.releaseYear,
            rating: Math.round(movie.rating * 10) / 10, // Ensure 1 decimal place
            durationMinutes: movie.durationMinutes,
            isVip: movie.isVip,
            type: movie.type,
            genres: movie.genres.map((mg: any) => mg.genre.name),
        };
    }
}
