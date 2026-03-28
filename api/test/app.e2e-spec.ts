/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns database status', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    // Health endpoint is VERSION_NEUTRAL and bypasses TransformInterceptor
    // Response shape depends on @nestjs/terminus (status/info at top level or in data)
    const healthBody = body.data ?? body;
    expect(healthBody.status).toBe('ok');
    expect(healthBody.info?.database?.status).toBe('up');
  });

  it('GET /v1/movies/trending returns movie list', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/v1/movies/trending')
      .expect(200);

    expect(Array.isArray(body.data)).toBe(true);
  });
});
