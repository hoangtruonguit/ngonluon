// email/email.producer.ts
import { Injectable, Logger } from '@nestjs/common';
import { QUEUES, RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class TmdbImportProducer {
  private readonly logger = new Logger(TmdbImportProducer.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async importBatchQueue(tmdbIds: (string | number)[]) {
    this.logger.log(`Queued import movie start: ${tmdbIds.length} items`);
    await this.rabbitMQService.publish(QUEUES.MOVIE_IMPORT, {
      tmdbIds: tmdbIds.map((id) => id.toString()),
    });
  }
}
