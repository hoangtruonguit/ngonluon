/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase } from './helpers/db-cleaner';

const TEST_USER = {
  email: 'e2e-auth@test.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  fullName: 'E2E Auth User',
  termsAccepted: true,
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('POST /v1/auth/register', () => {
    it('registers a new user and returns 201', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(body.data).toMatchObject({
        email: TEST_USER.email,
        fullName: TEST_USER.fullName,
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.password).toBeUndefined();
    });

    it('rejects duplicate email with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER)
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER)
        .expect(400);

      expect(body.message).toMatch(/already exists/i);
    });

    it('rejects mismatched passwords with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...TEST_USER, confirmPassword: 'wrong' })
        .expect(400);
    });

    it('rejects missing required fields with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: TEST_USER.email })
        .expect(400);
    });

    it('rejects short password with 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...TEST_USER, password: 'short', confirmPassword: 'short' })
        .expect(400);
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER);
    });

    it('returns 200 and sets cookies on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password })
        .expect(201);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('returns 401 on wrong password', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPassword!' })
        .expect(401);
    });

    it('returns 401 on unknown email', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nobody@test.com', password: TEST_USER.password })
        .expect(401);
    });
  });

  describe('GET /v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER);

      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      accessToken = loginRes.body.data.accessToken;
    });

    it('returns current user when authenticated via cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const cookieHeader = cookies.join('; ');

      const { body } = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(body.data.email).toBe(TEST_USER.email);
    });

    it('returns current user when authenticated via Bearer token', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(body.data.email).toBe(TEST_USER.email);
    });

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('clears auth cookies on logout', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(TEST_USER);

      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const cookieHeader = cookies.join('; ');

      const logoutRes = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(201);

      const logoutCookies = logoutRes.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(logoutCookies.some((c) => c.includes('access_token=;'))).toBe(
        true,
      );
    });
  });
});
