import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RabbitMQService } from './../src/rabbitmq/rabbitmq.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('AMQP_CONNECTION_MANAGER')
      .useValue({
        createChannel: () => ({
          addSetup: () => Promise.resolve(),
          publish: () => Promise.resolve(),
          close: () => Promise.resolve(),
          on: () => ({}),
          waitForConnect: () => Promise.resolve(),
        }),
        close: () => Promise.resolve(),
      })
      .overrideProvider(RabbitMQService)
      .useValue({
        onModuleInit: () => {},
        onModuleDestroy: () => Promise.resolve(),
        publish: () => Promise.resolve(),
        consume: () => Promise.resolve(),
        consumeDLQ: () => Promise.resolve(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
