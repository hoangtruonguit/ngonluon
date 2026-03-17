import { Module, Global, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import * as amqp from 'amqp-connection-manager';

const amqpConnectionManagerProvider: Provider = {
    provide: 'AMQP_CONNECTION_MANAGER',
    useFactory: (configService: ConfigService) => {
        const url = configService.get<string>(
            'RABBITMQ_URL',
            'amqp://localhost:5672',
        );
        return amqp.connect([url]);
    },
    inject: [ConfigService],
};

@Global()
@Module({
    imports: [ConfigModule],
    providers: [amqpConnectionManagerProvider, RabbitMQService],
    exports: ['AMQP_CONNECTION_MANAGER', RabbitMQService],
})
export class RabbitMQModule { }
