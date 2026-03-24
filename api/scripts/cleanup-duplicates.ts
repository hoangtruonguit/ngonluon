import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MoviesRepository } from '../src/movies/movies.repository';

async function cleanup() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const moviesRepo = app.get(MoviesRepository);

  console.log('Finding duplicate titles...');
  
  // Find movies with the exact same title
  const duplicateTitles = await prisma.movie.groupBy({
    by: ['title'],
    _count: { title: true },
    having: { title: { _count: { gt: 1 } } }
  });

  console.log(`Found ${duplicateTitles.length} duplicated titles.`);

  let deletedCount = 0;

  for (const dup of duplicateTitles) {
    console.log(`\nProcessing duplicates for: "${dup.title}"`);
    
    // Fetch all movies with this title, ordered by creation (keep oldest)
    const movies = await prisma.movie.findMany({
      where: { title: dup.title },
      orderBy: { createdAt: 'asc' },
    });

    // Keep the first one, delete the rest
    const [keep, ...toDelete] = movies;
    console.log(`Keeping: ${keep.id} [${keep.slug}]`);

    for (const movie of toDelete) {
      console.log(`Deleting: ${movie.id} [${movie.slug}]`);
      try {
        // This will also fire the MovieDeletedEvent and remove it from Elasticsearch
        await moviesRepo.delete(movie.id);
        deletedCount++;
        console.log(`✔ Successfully deleted ${movie.id}`);
      } catch (err) {
        console.error(`Failed to delete ${movie.id}:`, err);
      }
    }
  }

  console.log(`\nCleanup complete. Total deleted: ${deletedCount}`);
  await app.close();
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
