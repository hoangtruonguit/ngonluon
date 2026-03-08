export interface MovieGenre {
    id: number;
    name: string;
    slug: string;
}

export interface Movie {
    id: string;
    title: string;
    slug: string;
    description: string;
    posterUrl: string;
    thumbnailUrl: string;
    trailerUrl: string;
    releaseYear: number;
    rating: number;
    durationMinutes: number;
    isVip: boolean;
    type: string;
    genres: string[];
}

import { apiClient, ApiResponse } from '@/lib/api';

export const movieService = {
    async getTrendingMovies(limit: number = 20): Promise<Movie[]> {
        try {
            const response = await apiClient.get<Movie[]>(`/movies/trending?limit=${limit}`, {
                next: { revalidate: 600 }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch trending movies', error);
            return [];
        }
    },

    async getNewReleases(limit: number = 20): Promise<Movie[]> {
        try {
            const response = await apiClient.get<Movie[]>(`/movies/new-releases?limit=${limit}`, {
                next: { revalidate: 600 }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch new releases', error);
            return [];
        }
    },

    async getGenres(): Promise<MovieGenre[]> {
        try {
            const response = await apiClient.get<MovieGenre[]>(`/movies/genres`, {
                next: { revalidate: 600 }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch genres', error);
            return [];
        }
    }
};
