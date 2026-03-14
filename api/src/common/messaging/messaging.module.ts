import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const USER_SERVICE = 'USER_SERVICE';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'user_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
