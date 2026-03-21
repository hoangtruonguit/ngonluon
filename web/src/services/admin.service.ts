import { apiClient, ApiResponse } from '@/lib/api';

export interface AdminMovie {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    posterUrl: string | null;
    thumbnailUrl: string | null;
    releaseYear: number | null;
    rating: number;
    durationMinutes: number | null;
    trailerUrl: string | null;
    type: 'MOVIE' | 'SERIES';
    isVip: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminMovieListResponse {
    data: AdminMovie[];
    meta: { page: number; limit: number };
}

export interface CreateMovieData {
    title: string;
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    releaseYear?: number;
    rating?: number;
    durationMinutes?: number;
    trailerUrl?: string;
    type: 'MOVIE' | 'SERIES';
}

export interface UpdateMovieData {
    title?: string;
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    releaseYear?: number;
    rating?: number;
    durationMinutes?: number;
    trailerUrl?: string;
}

class AdminService {
    async getMovies(page = 1, limit = 20): Promise<AdminMovieListResponse> {
        const res = await apiClient.get<AdminMovieListResponse>(`/admin/movies?page=${page}&limit=${limit}`);
        return res.data;
    }

    async getMovie(id: string): Promise<AdminMovie> {
        const res = await apiClient.get<AdminMovie>(`/admin/movies/${id}`);
        return res.data;
    }

    async createMovie(data: CreateMovieData): Promise<AdminMovie> {
        const res = await apiClient.post<AdminMovie>('/admin/movies', data);
        return res.data;
    }

    async updateMovie(id: string, data: UpdateMovieData): Promise<AdminMovie> {
        const res = await apiClient.patch<AdminMovie>(`/admin/movies/${id}`, data);
        return res.data;
    }

    async deleteMovie(id: string): Promise<void> {
        await apiClient.delete(`/admin/movies/${id}`);
    }

    async crawlGenres(): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post<{ message: string }>('/admin/crawl/genres', {});
    }

    async crawlPopular(pages = 1): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post<{ message: string }>(`/admin/crawl/popular?pages=${pages}`, {});
    }

    async crawlTrailers(): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post<{ message: string }>('/admin/crawl/trailers', {});
    }
}

export const adminService = new AdminService();
