// movies.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindMoviesParams } from './interfaces/find-movies.interface';

@Injectable()
export class MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: FindMoviesParams = {}) {
    const { where, orderBy, include, skip, take = 20 } = params;

    return this.prisma.movie.findMany({
      where,
      orderBy,
      include,
      skip,
      take,
    });
  }

  async findBySlug(slug: string) {
  return this.prisma.movie.findUnique({
    where: { slug },
    include: {
      genres: { include: { genre: true } },
      cast: {
        include: { person: true },
        orderBy: { role: 'asc' },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      episodes: true,
    },
  });
}

  async findBySlugWithGenres(slug: string) {
    return this.prisma.movie.findUnique({
      where: { slug },
      include: { genres: true },
    });
  }

  async findManyGenres() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
