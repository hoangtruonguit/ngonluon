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
  score: number; // 0-1 similarity/relevance score
  reason?: string; // e.g. "Because you watched Inception"
  source: 'content' | 'collaborative' | 'trending' | 'similar';
}

export interface UserProfile {
  userId: string;
  vector: number[]; // 384 dims
  interactionCount: number;
  topGenres: string[];
  updatedAt: Date;
}

export interface UserInteraction {
  movieId: string;
  weight: number;
  embedding: number[];
}

export interface RawMovieRow {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  release_year: number | null;
  rating: number;
  type: string;
  is_premium: boolean;
  similarity: number;
}
