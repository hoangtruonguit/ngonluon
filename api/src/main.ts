import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import { logger } from './common/logger/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true, // In production, replace with specific origins
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('CineStream API')
    .setDescription('The CineStream API description')
    .setVersion('1.0')
    .addTag('Auth')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const configService = app.get(ConfigService);
  await app.listen(configService.get<number>('PORT') || 3001);
}
bootstrap().catch((err) => {
  logger.error(
    'Unhandled bootstrap error:',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
