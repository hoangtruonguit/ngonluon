import { apiClient } from '@/lib/api';

export interface SearchResult {
    source: 'local' | 'tmdb';
    id: string;
    tmdbId?: number;
    title: string;
    slug?: string;
    description?: string;
    posterUrl: string | null;
    releaseYear: number | null;
    rating: number;
    genres: string[];
    highlight?: Record<string, string[]>;
    matchedCast?: { name: string; role: string }[];
}

export interface SearchResponse {
    total: number;
    results: SearchResult[];
    page: number;
    limit: number;
    totalPages: number;
}

export interface SearchParams {
    q?: string;
    page?: number;
    genre?: string;
    type?: string;
    yearFrom?: number;
    yearTo?: number;
    minRating?: number;
    sortBy?: string;
    limit?: number;
}

export const searchService = {
    search: async (params: SearchParams): Promise<SearchResponse> => {
        try {
            const queryParams = new URLSearchParams();
            if (params.q) queryParams.append('q', params.q);
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.genre) queryParams.append('genre', params.genre);
            if (params.type) queryParams.append('type', params.type);
            if (params.yearFrom) queryParams.append('yearFrom', params.yearFrom.toString());
            if (params.yearTo) queryParams.append('yearTo', params.yearTo.toString());
            if (params.minRating) queryParams.append('minRating', params.minRating.toString());
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);

            const response = await apiClient.get<SearchResponse>(`/search?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Search failed:', error);
            return { total: 0, results: [], page: 1, limit: 12, totalPages: 0 };
        }
    },
    suggest: async (q: string): Promise<SearchResult[]> => {
        try {
            const response = await apiClient.get<SearchResult[]>(`/search/suggest?q=${encodeURIComponent(q)}`);
            return response.data;
        } catch (error) {
            console.error('Suggestions failed:', error);
            return [];
        }
    },

    importMovie: async (tmdbId: number): Promise<string> => {
        try {
            const response = await apiClient.post<{ slug: string }>('/search/import', { tmdbId });
            return response.data.slug;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
};
