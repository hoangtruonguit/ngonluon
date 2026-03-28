/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase } from './helpers/db-cleaner';
import { PrismaService } from '../src/prisma/prisma.service';

const TEST_USER = {
  email: 'e2e-watchlist@test.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  fullName: 'Watchlist User',
  termsAccepted: true,
};

async function seedMovie(
  app: INestApplication,
): Promise<{ id: string; slug: string }> {
  const prisma = app.get(PrismaService);
  const movie = await prisma.movie.create({
    data: {
      title: 'Test Movie',
      slug: 'test-movie-watchlist',
      description: 'A test movie',
      durationMinutes: 90,
      isPremium: false,
      releaseYear: 2024,
      type: 'MOVIE' as const,
    },
  });
  return { id: movie.id, slug: movie.slug };
}

describe('Watchlist (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let movieId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(TEST_USER);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    accessToken = loginRes.body.data.accessToken;

    const movie = await seedMovie(app);
    movieId = movie.id;
  });

  describe('POST /v1/watchlist', () => {
    it('adds movie to watchlist when authenticated', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ movieId })
        .expect(201);

      expect(body.data.movieId).toBe(movieId);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/v1/watchlist')
        .send({ movieId })
        .expect(401);
    });
  });

  describe('GET /v1/watchlist', () => {
    it('returns empty list initially', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    it('returns watchlist after adding a movie', async () => {
      await request(app.getHttpServer())
        .post('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ movieId });

      const { body } = await request(app.getHttpServer())
        .get('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].movieId).toBe(movieId);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/v1/watchlist').expect(401);
    });
  });

  describe('GET /v1/watchlist/status/:movieId', () => {
    it('returns false when movie not in watchlist', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/v1/watchlist/status/${movieId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(body.data.isInWatchlist).toBe(false);
    });

    it('returns true after adding movie', async () => {
      await request(app.getHttpServer())
        .post('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ movieId });

      const { body } = await request(app.getHttpServer())
        .get(`/v1/watchlist/status/${movieId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(body.data.isInWatchlist).toBe(true);
    });
  });

  describe('DELETE /v1/watchlist/:movieId', () => {
    it('removes movie from watchlist', async () => {
      await request(app.getHttpServer())
        .post('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ movieId });

      await request(app.getHttpServer())
        .delete(`/v1/watchlist/${movieId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const { body } = await request(app.getHttpServer())
        .get('/v1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(body.data).toHaveLength(0);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/watchlist/${movieId}`)
        .expect(401);
    });
  });
});
