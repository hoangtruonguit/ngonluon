import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ElasticsearchModule, TmdbModule, PrismaModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
