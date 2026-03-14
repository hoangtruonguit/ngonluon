import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MoviesRepository } from './movies.repository';

@Module({
    imports: [PrismaModule],
    providers: [MoviesService, MoviesRepository],
    controllers: [MoviesController],
    exports: [MoviesService, MoviesRepository],
})
export class MoviesModule { }
