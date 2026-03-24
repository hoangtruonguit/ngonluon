// mappers/movie.mapper.ts
import { MovieWithGenres, MovieDetailed } from '../types/movie.types';

export class MovieMapper {
  static toResponse(movie: MovieWithGenres) {
    return {
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      description: movie.description,
      posterUrl: movie.posterUrl,
      thumbnailUrl: movie.thumbnailUrl,
      trailerUrl: movie.trailerUrl,
      releaseYear: movie.releaseYear,
      rating: Math.round(movie.rating * 10) / 10,
      durationMinutes: movie.durationMinutes,
      isPremium: movie.isPremium,
      requiresSubscription: movie.isPremium,
      type: movie.type,
      genres: movie.genres.map((mg) => mg.genre.name),
    };
  }

  static toDetailedResponse(movie: MovieDetailed) {
    const reviews = movie.reviews ?? [];
    const totalReviews = reviews.length;

    const ratingCounts = [0, 0, 0, 0, 0];
    let ratingSum = 0;

    for (const review of reviews) {
      const r = Math.max(1, Math.min(5, review.rating));
      ratingCounts[r - 1]++;
      ratingSum += r;
    }

    const averageRating =
      totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

    const distribution = [...ratingCounts]
      .map((count) => ({
        count,
        percentage:
          totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
      }))
      .reverse();

    return {
      ...MovieMapper.toResponse(movie),
      videoUrl: movie.episodes?.[0]?.videoUrl || movie.trailerUrl || '',
      cast: movie.cast.map((c) => ({
        personId: c.personId,
        name: c.person.name,
        avatarUrl: c.person.avatarUrl,
        characterName: c.characterName,
        role: c.role,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          fullName: r.user.fullName,
          avatarUrl: r.user.avatarUrl,
        },
      })),
      audienceRating: {
        average: averageRating,
        totalReviews,
        distribution,
      },
    };
  }
}
