/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase } from './helpers/db-cleaner';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const REGULAR_USER = {
  email: 'e2e-user@test.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  fullName: 'Regular User',
  termsAccepted: true,
};

async function seedAdminUser(
  app: INestApplication,
): Promise<{ accessToken: string }> {
  const prisma = app.get(PrismaService);

  const hashedPassword = await bcrypt.hash('AdminPass123!', 10);

  // Ensure the ADMIN role row exists
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const user = await prisma.user.create({
    data: {
      email: 'e2e-admin@test.com',
      password: hashedPassword,
      fullName: 'Admin User',
    },
  });

  await prisma.userRole.create({
    data: { userId: user.id, roleId: adminRole.id },
  });

  const loginRes = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email: 'e2e-admin@test.com', password: 'AdminPass123!' });

  return { accessToken: loginRes.body.data.accessToken };
}

describe('Admin (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    const admin = await seedAdminUser(app);
    adminToken = admin.accessToken;

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(REGULAR_USER);
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: REGULAR_USER.email, password: REGULAR_USER.password });
    userToken = loginRes.body.data.accessToken;
  });

  describe('GET /v1/admin/movies', () => {
    it('returns paginated movies list for admin', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/v1/admin/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(body.data).toBeDefined();
      // listMovies returns { data: movies[], meta: {...} } wrapped in TransformInterceptor's data field
      expect(body.data.meta).toMatchObject({
        page: 1,
        limit: 20,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/v1/admin/movies').expect(401);
    });

    it('returns 403 for regular user', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /v1/admin/movies', () => {
    const newMovie = {
      title: 'Admin Created Movie',
      description: 'Created via admin API',
      durationMinutes: 120,
      releaseYear: 2024,
      type: 'MOVIE',
    };

    it('creates a movie for admin', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/v1/admin/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newMovie)
        .expect(201);

      expect(body.data.title).toBe(newMovie.title);
      expect(body.data.id).toBeDefined();
    });

    it('returns 403 for regular user', async () => {
      await request(app.getHttpServer())
        .post('/v1/admin/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newMovie)
        .expect(403);
    });
  });

  describe('DELETE /v1/admin/movies/:id', () => {
    it('deletes a movie as admin', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/admin/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Movie to Delete',
          description: 'Will be deleted',
          durationMinutes: 60,
          releaseYear: 2024,
          type: 'MOVIE',
        });

      const movieId = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/v1/admin/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('returns 404 for non-existent movie', async () => {
      await request(app.getHttpServer())
        .delete('/v1/admin/movies/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
