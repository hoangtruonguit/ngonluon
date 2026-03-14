// movies.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindMoviesParams } from './interfaces/find-movies.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MovieCreatedEvent, MovieUpdatedEvent, MovieDeletedEvent } from '../events/movie.events';
import { Prisma } from '@prisma/client';

@Injectable()
export class MoviesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

  async findById(id: string) {
    return this.prisma.movie.findUnique({
      where: { id },
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

  async findByTitle(title: string) {
    return this.prisma.movie.findFirst({
      where: { title },
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

  async findGenreById(id: number) {
    return this.prisma.genre.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.MovieCreateInput) {
    const movie = await this.prisma.movie.create({ data });
    this.eventEmitter.emit(MovieCreatedEvent.name, new MovieCreatedEvent(movie.id));
    return movie;
  }

  async update(id: string, data: Prisma.MovieUpdateInput) {
    const movie = await this.prisma.movie.update({
      where: { id },
      data,
    });
    this.eventEmitter.emit(MovieUpdatedEvent.name, new MovieUpdatedEvent(movie.id));
    return movie;
  }

  async delete(id: string) {
    const movie = await this.prisma.movie.delete({
      where: { id },
    });
    this.eventEmitter.emit(MovieDeletedEvent.name, new MovieDeletedEvent(movie.id));
    return movie;
  }

  async upsertGenre(data: { id: number; name: string; slug: string }) {
    return this.prisma.genre.upsert({
      where: { id: data.id },
      update: { name: data.name, slug: data.slug },
      create: { id: data.id, name: data.name, slug: data.slug },
    });
  }

  async addGenreToMovie(movieId: string, genreId: number) {
    return this.prisma.movieGenre.upsert({
      where: {
        movieId_genreId: { movieId, genreId },
      },
      update: {},
      create: { movieId, genreId },
    });
  }

  async upsertPerson(name: string, avatarUrl: string | null) {
    // Note: This is a simplistic approach by name. Ideally use a formal primary key or TMDB ID.
    const person = await this.prisma.person.findFirst({
      where: { name },
    });

    if (person) {
      if (avatarUrl && person.avatarUrl !== avatarUrl) {
        return this.prisma.person.update({
          where: { id: person.id },
          data: { avatarUrl },
        });
      }
      return person;
    }

    return this.prisma.person.create({
      data: { name, avatarUrl },
    });
  }

  async addCast(data: {
    movieId: string;
    personId: string;
    characterName?: string;
    role: 'ACTOR' | 'DIRECTOR';
  }) {
    return this.prisma.cast.upsert({
      where: {
        movieId_personId_role: {
          movieId: data.movieId,
          personId: data.personId,
          role: data.role,
        },
      },
      update: { characterName: data.characterName },
      create: {
        movieId: data.movieId,
        personId: data.personId,
        characterName: data.characterName,
        role: data.role,
      },
    });
  }
}
