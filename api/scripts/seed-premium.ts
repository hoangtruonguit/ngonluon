/**
 * Mark ~30% of movies as isPremium = true for testing.
 *
 * Usage:  npx ts-node scripts/seed-premium.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Reset all movies to non-premium first
    await prisma.movie.updateMany({ data: { isPremium: false } });

    const allMovies = await prisma.movie.findMany({
      select: { id: true, title: true },
      orderBy: { rating: 'desc' },
    });

    // Pick ~30% of movies (top-rated ones → premium feels natural)
    const premiumCount = Math.max(1, Math.ceil(allMovies.length * 0.3));
    const premiumMovies = allMovies.slice(0, premiumCount);
    const premiumIds = premiumMovies.map((m) => m.id);

    const result = await prisma.movie.updateMany({
      where: { id: { in: premiumIds } },
      data: { isPremium: true },
    });

    console.log(`Marked ${result.count} / ${allMovies.length} movies as Premium:`);
    premiumMovies.forEach((m) => console.log(`  ✓ ${m.title}`));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
