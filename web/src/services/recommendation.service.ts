import { apiClient } from '@/lib/api';

export interface MovieRecommendation {
    movie: {
        id: string;
        title: string;
        slug: string;
        posterUrl: string | null;
        releaseYear: number | null;
        rating: number;
        type: string;
        genres: string[];
        isPremium: boolean;
    };
    score: number;
    reason?: string;
    source: 'content' | 'collaborative' | 'trending' | 'similar';
}

class RecommendationService {
    async getForYou(limit = 12): Promise<MovieRecommendation[]> {
        try {
            const response = await apiClient.get<MovieRecommendation[]>(
                `/recommendations/for-you?limit=${limit}`
            );
            return response.data;
        } catch {
            return [];
        }
    }

    async getBecauseYouWatched(movieId: string, limit = 10): Promise<MovieRecommendation[]> {
        try {
            const response = await apiClient.get<MovieRecommendation[]>(
                `/recommendations/because-you-watched/${movieId}?limit=${limit}`
            );
            return response.data;
        } catch {
            return [];
        }
    }

    async getSimilar(movieId: string, limit = 10): Promise<MovieRecommendation[]> {
        try {
            const response = await apiClient.get<MovieRecommendation[]>(
                `/recommendations/similar/${movieId}?limit=${limit}`
            );
            return response.data;
        } catch {
            return [];
        }
    }

    async getTrendingForYou(limit = 10): Promise<MovieRecommendation[]> {
        try {
            const response = await apiClient.get<MovieRecommendation[]>(
                `/recommendations/trending-for-you?limit=${limit}`
            );
            return response.data;
        } catch {
            return [];
        }
    }
}

export const recommendationService = new RecommendationService();
