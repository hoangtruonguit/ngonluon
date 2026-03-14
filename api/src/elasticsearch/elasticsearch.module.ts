import { Module } from '@nestjs/common';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { SyncService } from './sync.service';
import { SyncCommand } from './sync.command';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>(
          'ELASTICSEARCH_URL',
          'http://localhost:9200',
        ),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [ElasticsearchService, SyncService, SyncCommand],
  exports: [ElasticsearchService, SyncService],
})
export class ElasticsearchModule {}
