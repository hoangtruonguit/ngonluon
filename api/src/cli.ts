import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { logger } from './common/logger/logger.config';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    logger: new Logger(),
  });
}

bootstrap().catch((err) => {
  logger.error(
    'Unhandled CLI bootstrap error:',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
