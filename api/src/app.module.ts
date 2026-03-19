import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { MoviesModule } from './movies/movies.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { SearchModule } from './search/search.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { WatchHistoryModule } from './watch-history/watch-history.module';
import { MovieSyncListener } from './elasticsearch/moive-sync.listener';
import { validate } from './common/config/env.validation';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RedisModule,
    RabbitMQModule,
    MailModule,
    TmdbModule,
    MoviesModule,
    EventEmitterModule.forRoot(),
    ElasticsearchModule,
    SearchModule,
    WatchlistModule,
    WatchHistoryModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MovieSyncListener,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
