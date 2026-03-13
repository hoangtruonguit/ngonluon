import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.movie.findFirst({ where: { title: 'Redeemed' } });
  console.log('Redeemed movie trailerUrl:', m?.trailerUrl);
}
main().finally(() => prisma.$disconnect());
