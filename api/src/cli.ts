import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: new Logger(),
  });
}

bootstrap();
