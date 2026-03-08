import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [HttpModule, PrismaModule],
    providers: [TmdbService],
    controllers: [TmdbController],
    exports: [TmdbService],
})
export class TmdbModule { }
