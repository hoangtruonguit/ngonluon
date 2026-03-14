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
import { MessagingModule } from './common/messaging/messaging.module';
import { MailModule } from './mail/mail.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { MoviesModule } from './movies/movies.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { SearchModule } from './search/search.module';
import { MovieSyncEsListener } from './listeners/moive-sync-es.listener';
import { validate } from './common/config/env.validation';

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
    MessagingModule,
    MailModule,
    TmdbModule,
    MoviesModule,
    EventEmitterModule.forRoot(),
    ElasticsearchModule,
    SearchModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MovieSyncEsListener,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
