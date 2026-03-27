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

export interface SubscriptionStats {
  byPlan: { planName: string; count: number }[];
  totalActive: number;
  newThisMonth: number;
  churnRate: number;
  timeline: TimeSeriesPoint[];
}

export interface OverviewStats {
  totalUsers: number;
  totalMovies: number;
  totalReviews: number;
  totalComments: number;
  activeSubscriptions: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
}

export interface RecommendationStats {
  totalEmbeddings: number;
  moviesWithoutEmbeddings: number;
  coverageRate: number; // % of catalog with embeddings
  avgInteractionsPerUser: number;
  topRecommendedMovies: { movieId: string; title: string; count: number }[];
}
