import { apiClient } from '@/lib/api';

export interface SearchResult {
    source: 'local' | 'tmdb';
    id: string;
    tmdbId?: number;
    title: string;
    slug?: string;
    posterUrl: string | null;
    releaseYear: number | null;
    rating: number;
    genres: string[];
    highlight?: any;
    matchedCast?: { name: string; role: string }[];
}

export interface SearchResponse {
    total: number;
    results: SearchResult[];
}

class SearchService {
    async search(params: {
        q: string;
        genre?: string;
        yearFrom?: number;
        yearTo?: number;
        minRating?: number;
        sortBy?: string;
        page?: number;
        limit?: number;
    }): Promise<SearchResponse> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('q', params.q);
            if (params.genre) queryParams.append('genre', params.genre);
            if (params.yearFrom) queryParams.append('yearFrom', params.yearFrom.toString());
            if (params.yearTo) queryParams.append('yearTo', params.yearTo.toString());
            if (params.minRating) queryParams.append('minRating', params.minRating.toString());
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await apiClient.get<SearchResponse>(`/search?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Search failed:', error);
            return { total: 0, results: [] };
        }
    }

    async suggest(q: string): Promise<SearchResult[]> {
        try {
            const response = await apiClient.get<SearchResult[]>(`/search/suggest?q=${encodeURIComponent(q)}`);
            return response.data;
        } catch (error) {
            console.error('Suggestions failed:', error);
            return [];
        }
    }

    async importMovie(tmdbId: number): Promise<string> {
        try {
            const response = await apiClient.post<{ slug: string }>('/search/import', { tmdbId });
            return response.data.slug;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}

export const searchService = new SearchService();
