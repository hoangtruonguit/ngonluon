import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Truncates all user-data tables in dependency order.
 * Keeps genres/movies for tests that need reference data.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.review.deleteMany(),
    prisma.watchHistory.deleteMany(),
    prisma.watchlist.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.user.deleteMany(),
    prisma.cast.deleteMany(),
    prisma.episode.deleteMany(),
    prisma.season.deleteMany(),
    prisma.movieGenre.deleteMany(),
    prisma.movie.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.person.deleteMany(),
  ]);
}
