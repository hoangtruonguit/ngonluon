import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { RabbitMQService } from '../../src/rabbitmq/rabbitmq.service';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { EmbeddingService } from '../../src/recommendations/embedding.service';

const AMQP_MOCK = {
  createChannel: () => ({
    addSetup: () => Promise.resolve(),
    publish: () => Promise.resolve(),
    close: () => Promise.resolve(),
    on: () => ({}),
    waitForConnect: () => Promise.resolve(),
  }),
  close: () => Promise.resolve(),
};

const RABBITMQ_MOCK = {
  onModuleInit: () => {},
  onModuleDestroy: () => Promise.resolve(),
  publish: () => Promise.resolve(),
  consume: () => Promise.resolve(),
  consumeDLQ: () => Promise.resolve(),
};

const EMBEDDING_MOCK = {
  onModuleInit: async () => {},
  retryLoad: async () => {},
  get isReady() { return true; },
  generateMovieText: () => 'mock text',
  embedText: async () => Array(384).fill(0.1),
  embedMany: async (texts: string[]) => texts.map(() => Array(384).fill(0.1)),
  embedMovie: async () => {},
  embedAllMovies: async () => {},
  deleteEmbedding: async () => {},
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('AMQP_CONNECTION_MANAGER')
    .useValue(AMQP_MOCK)
    .overrideProvider(RabbitMQService)
    .useValue(RABBITMQ_MOCK)
    .overrideProvider(EmbeddingService)
    .useValue(EMBEDDING_MOCK)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  await app.init();
  return app;
}
