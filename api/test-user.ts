import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'verify@test.com' } });
  console.log(user);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
