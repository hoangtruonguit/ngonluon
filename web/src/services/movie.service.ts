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

export interface CastMember {
    personId: string;
    name: string;
    avatarUrl: string | null;
    characterName: string | null;
    role: string;
}

export interface MovieReview {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    };
}

export interface MovieComment {
    id: string;
    content: string;
    isSpoiler: boolean;
    createdAt: string;
    user: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    };
}

export interface AudienceRating {
    average: number;
    totalReviews: number;
    distribution: { count: number; percentage: number }[];
}

export interface MovieDetail extends Movie {
    videoUrl: string;
    cast: CastMember[];
    reviews: MovieReview[];
    audienceRating: AudienceRating;
}

import { apiClient, ApiResponse } from '@/lib/api';

class MovieService {
    getHighResImage(url: string | null | undefined): string {
        if (!url) return '';
        if (url.includes('image.tmdb.org/t/p/w500')) {
            return url.replace('/w500/', '/original/');
        }
        return url;
    }

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
    }

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
    }

    async getNowPlayingMovies(limit: number = 20): Promise<Movie[]> {
        try {
            const response = await apiClient.get<Movie[]>(`/movies/now-playing?limit=${limit}`, {
                next: { revalidate: 600 }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch now playing movies', error);
            return [];
        }
    }

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

    async getMovieBySlug(slug: string): Promise<MovieDetail | null> {
        try {
            const response = await apiClient.get<MovieDetail>(`/movies/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch movie details', error);
            return null;
        }
    }

    async getSimilarMovies(slug: string, limit: number = 5): Promise<Movie[]> {
        try {
            const response = await apiClient.get<Movie[]>(`/movies/${slug}/similar?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch similar movies', error);
            return [];
        }
    }

    async searchMovies(params: {
        q?: string;
        genre?: string;
        year?: string;
        rating?: string;
        sortBy?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: Movie[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        try {
            const queryParams = new URLSearchParams();
            if (params.q) queryParams.append('q', params.q);
            if (params.genre) queryParams.append('genre', params.genre);
            if (params.year) queryParams.append('year', params.year);
            if (params.rating) queryParams.append('rating', params.rating);
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await apiClient.get<{ data: Movie[]; meta: any }>(`/movies/search?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Failed to search movies', error);
            return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }
    }

    async getCommentsByMovie(movieId: string, skip: number = 0, take: number = 20): Promise<MovieComment[]> {
        try {
            const response = await apiClient.get<MovieComment[]>(`/movies/${movieId}/comments?skip=${skip}&take=${take}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch comments', error);
            return [];
        }
    }

    async addComment(movieId: string, content: string, isSpoiler: boolean = false): Promise<MovieComment | null> {
        try {
            const response = await apiClient.post<MovieComment>(`/movies/${movieId}/comments`, {
                content,
                isSpoiler
            });
            return response.data;
        } catch (error) {
            console.error('Failed to add comment', error);
            return null;
        }
    }
}

export const movieService = new MovieService();

