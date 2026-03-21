import { apiClient, ApiResponse } from '@/lib/api';

// ─── Analytics Types ─────────────────────────────────

export interface OverviewStats {
    totalUsers: number;
    totalMovies: number;
    totalReviews: number;
    totalComments: number;
    activeSubscriptions: number;
    newUsersLast7d: number;
    newUsersLast30d: number;
}

export interface TimeSeriesPoint {
    date: string;
    count: number;
}

export interface WatchActivityPoint {
    date: string;
    views: number;
    watchHours: number;
    completionRate: number;
}

export interface TopContentItem {
    movieId: string;
    title: string;
    posterUrl: string | null;
    value: number;
}

export interface GenrePopularityItem {
    genre: string;
    views: number;
    watchlistCount: number;
}

export interface ActivityFeedItem {
    type: 'review' | 'comment' | 'registration';
    user: { id: string; fullName: string | null; avatarUrl: string | null };
    content?: string;
    movieTitle?: string;
    rating?: number;
    createdAt: string;
}

// ─── User Management Types ───────────────────────────

export interface AdminUser {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    roles: string[];
    _count: { reviews: number; comments: number; watchHistory: number };
}

export interface AdminUserListResponse {
    data: AdminUser[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminUserDetail extends AdminUser {
    _count: { reviews: number; comments: number; watchHistory: number; watchlist: number };
}

// ─── Movie Types ─────────────────────────────────────

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

    // ─── Analytics ────────────────────────────────────

    async getOverviewStats(): Promise<OverviewStats> {
        const res = await apiClient.get<OverviewStats>('/admin/analytics/overview');
        return res.data;
    }

    async getUserGrowth(period: '7d' | '30d' | '90d' = '30d'): Promise<TimeSeriesPoint[]> {
        const res = await apiClient.get<TimeSeriesPoint[]>(`/admin/analytics/user-growth?period=${period}`);
        return res.data;
    }

    async getWatchActivity(period: '7d' | '30d' | '90d' = '30d'): Promise<WatchActivityPoint[]> {
        const res = await apiClient.get<WatchActivityPoint[]>(`/admin/analytics/watch-activity?period=${period}`);
        return res.data;
    }

    async getTopContent(type: 'watched' | 'rated' | 'commented' = 'watched', limit = 10): Promise<TopContentItem[]> {
        const res = await apiClient.get<TopContentItem[]>(`/admin/analytics/top-content?type=${type}&limit=${limit}`);
        return res.data;
    }

    async getGenrePopularity(): Promise<GenrePopularityItem[]> {
        const res = await apiClient.get<GenrePopularityItem[]>('/admin/analytics/genre-popularity');
        return res.data;
    }

    async getRecentActivity(limit = 20): Promise<ActivityFeedItem[]> {
        const res = await apiClient.get<ActivityFeedItem[]>(`/admin/analytics/recent-activity?limit=${limit}`);
        return res.data;
    }

    // ─── User Management ─────────────────────────────

    async getUsers(page = 1, limit = 20, search?: string, role?: string): Promise<AdminUserListResponse> {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set('search', search);
        if (role) params.set('role', role);
        const res = await apiClient.get<AdminUserListResponse>(`/admin/users?${params}`);
        return res.data;
    }

    async getUser(id: string): Promise<AdminUserDetail> {
        const res = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`);
        return res.data;
    }

    async updateUserRoles(id: string, roles: string[]): Promise<AdminUserDetail> {
        const res = await apiClient.patch<AdminUserDetail>(`/admin/users/${id}/roles`, { roles });
        return res.data;
    }

    async toggleUserStatus(id: string, isActive: boolean): Promise<AdminUserDetail> {
        const res = await apiClient.patch<AdminUserDetail>(`/admin/users/${id}/status`, { isActive });
        return res.data;
    }
}

export const adminService = new AdminService();
