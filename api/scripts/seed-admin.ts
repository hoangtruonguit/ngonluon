import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Ensure ADMIN role exists
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator' },
  });
  console.log('Admin role:', adminRole);

  // Hash password
  const password = await bcrypt.hash('Admin@123', 10);

  // Create admin user
  const user = await prisma.user.upsert({
    where: { email: 'admin@ngonluon.com' },
    update: {},
    create: {
      email: 'admin@ngonluon.com',
      password,
      fullName: 'Admin',
      isActive: true,
    },
  });
  console.log('User:', user.id, user.email);

  // Assign ADMIN role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });
  console.log('Admin role assigned successfully!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
