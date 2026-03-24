const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = unknown> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    termsAccepted: boolean;
}

export interface RegisterResponse {
    id: string;
    email: string;
    fullName: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
    expiresIn: number;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    protected async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                statusCode: response.status,
                message: data.message || 'An error occurred',
                data: data.data || null,
            };
        }

        return data;
    }

    // Generic methods
    async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }

    // Auth endpoints
    async register(data: RegisterData): Promise<ApiResponse<RegisterResponse>> {
        return this.request<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
        return this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }

    async getMe(): Promise<ApiResponse<UserResponseDto>> {
        return this.get<UserResponseDto>('/auth/me');
    }

    async updateProfile(data: { fullName?: string; avatarUrl?: string }): Promise<ApiResponse<UserResponseDto>> {
        return this.patch<UserResponseDto>('/users/profile', data);
    }

    async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseUrl}/users/avatar`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                statusCode: response.status,
                message: data.message || 'An error occurred',
                data: data.data || null,
            };
        }

        return data;
    }

    // Watchlist endpoints
    async addToWatchlist(movieId: string) {
        return this.post('/watchlist', { movieId });
    }

    async removeFromWatchlist(movieId: string) {
        return this.delete(`/watchlist/${movieId}`);
    }

    async getWatchlistStatus(movieId: string): Promise<ApiResponse<{ isInWatchlist: boolean }>> {
        return this.get<{ isInWatchlist: boolean }>(`/watchlist/status/${movieId}`);
    }

    async getWatchlist(): Promise<ApiResponse<WatchlistItemResponseDto[]>> {
        return this.get<WatchlistItemResponseDto[]>('/watchlist');
    }

    // Watch history endpoints
    async getWatchHistory(): Promise<ApiResponse<WatchHistoryResponseDto[]>> {
        return this.get<WatchHistoryResponseDto[]>('/watch-history');
    }

    async getWatchProgress(movieId: string, episodeId?: string): Promise<ApiResponse<WatchProgressResponseDto>> {
        return this.get<WatchProgressResponseDto>(`/watch-history/${movieId}${episodeId ? `?episodeId=${episodeId}` : ''}`);
    }

    async recordWatchHistory(movieId: string, data?: { episodeId?: string; progressSeconds?: number; isFinished?: boolean }) {
        return this.post('/watch-history', { movieId, ...data });
    }

    async clearWatchHistory() {
        return this.delete('/watch-history/clear');
    }
}

/**
 * Resolve an avatar URL: prepend API base for relative paths (e.g. /uploads/avatars/...).
 */
export function resolveAvatarUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
}

export interface UserResponseDto {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    roles?: string[];
}

export interface MovieResponseDto {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    posterUrl: string;
    slug: string;
    rating: number;
    durationMinutes: number;
    isPremium: boolean;
}

export interface WatchlistItemResponseDto {
    id: string;
    movieId: string;
    addedAt: string;
    movie: MovieResponseDto;
}

export interface WatchHistoryResponseDto {
    id: string;
    movieId: string;
    episodeId?: string;
    progressSeconds: number;
    isFinished: boolean;
    updatedAt: string;
    movie: MovieResponseDto;
}

export interface WatchProgressResponseDto {
    movieId: string;
    episodeId?: string;
    progressSeconds: number;
    isFinished: boolean;
}

export const apiClient = new ApiClient(API_BASE_URL);
