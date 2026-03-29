/**
 * Master seeder — chạy tất cả seeders theo thứ tự đúng.
 *
 * Usage:
 *   pnpm run seed:all
 *
 * Thứ tự:
 *   1. Admin user + roles
 *   2. TMDB genres + movies (yêu cầu TMDB_API_KEY)
 *   3. Trailers
 *   4. Premium movies
 *   5. Reviews & comments
 *   6. Embeddings (optional, bỏ qua nếu pass --skip-embeddings)
 */

import 'dotenv/config';
import { execSync } from 'child_process';

const SKIP_EMBEDDINGS = process.argv.includes('--skip-embeddings');

const steps: Array<{ name: string; cmd: string; skip?: boolean }> = [
  {
    name: 'Admin user & roles',
    cmd: 'ts-node -r tsconfig-paths/register scripts/seed-admin.ts',
  },
  {
    name: 'TMDB genres & movies',
    cmd: 'ts-node -r tsconfig-paths/register src/tmdb/commands/seed.ts',
  },
  {
    name: 'Trailers',
    cmd: 'ts-node -r tsconfig-paths/register src/tmdb/commands/seed-trailers.ts',
  },
  {
    name: 'Premium movies',
    cmd: 'ts-node -r tsconfig-paths/register scripts/seed-premium.ts',
  },
  {
    name: 'Analytics & movies',
    cmd: 'ts-node -r tsconfig-paths/register scripts/seed-analytics.ts',
  },
  {
    name: 'Reviews & comments',
    cmd: 'ts-node -r tsconfig-paths/register scripts/seed-reviews.ts',
  },
  {
    name: 'Embeddings (vector search)',
    cmd: 'ts-node -r tsconfig-paths/register scripts/seed-embeddings.ts',
    skip: SKIP_EMBEDDINGS,
  },
];

const total = steps.filter((s) => !s.skip).length;
let current = 0;

console.log('='.repeat(60));
console.log('🌱 MASTER SEEDER');
console.log('='.repeat(60));
if (SKIP_EMBEDDINGS) {
  console.log('ℹ️  --skip-embeddings: bỏ qua bước tạo embeddings\n');
}

for (const step of steps) {
  if (step.skip) {
    console.log(`\n⏭️  [skip] ${step.name}`);
    continue;
  }

  current++;
  console.log(`\n[${current}/${total}] ${step.name}`);
  console.log('-'.repeat(60));

  try {
    execSync(step.cmd, { stdio: 'inherit' });
    console.log(`✅ ${step.name} — done`);
  } catch (err) {
    console.error(`\n❌ Lỗi tại bước: ${step.name}`);
    console.error('Để chạy lại từ bước này:');
    console.error(`  pnpm exec ${step.cmd}`);
    process.exit(1);
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Seed hoàn tất!');
console.log('='.repeat(60));
console.log('\nTài khoản admin:');
console.log('  Email   : admin@ngonluon.com');
console.log('  Password: Admin@123');
console.log('\n⚠️  Đổi mật khẩu admin sau khi deploy production!');
