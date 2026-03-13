import { Prisma } from '@prisma/client';

export type MovieWithGenres = Prisma.MovieGetPayload<{
  include: {
    genres: { include: { genre: true } };
  };
}>;

export type MovieDetailed = Prisma.MovieGetPayload<{
  include: {
    genres: { include: { genre: true } };
    cast: { include: { person: true } };
    reviews: {
      include: {
        user: {
          select: { id: true; fullName: true; avatarUrl: true };
        };
      };
    };
    episodes: true;
  };
}>;
