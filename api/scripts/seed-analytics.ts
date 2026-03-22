import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

/**
 * Seed realistic data for admin dashboard analytics.
 * Creates: users (spread over 90 days), roles, reviews, comments,
 * watch history, watchlist entries, and subscriptions.
 */

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const ms = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const FIRST_NAMES = [
  'Minh', 'Linh', 'Hoa', 'Tuan', 'Nam', 'Lan', 'Duc', 'Thu',
  'Hung', 'Mai', 'Quang', 'Ngoc', 'Binh', 'Huong', 'Phuc',
  'Anh', 'Khoa', 'Vy', 'Dat', 'Trang', 'Long', 'Nhi', 'Khanh',
  'Thao', 'Duy', 'Phuong', 'Hai', 'Tam', 'Son', 'Trinh',
  'John', 'Emma', 'Alex', 'Sarah', 'David', 'Lisa', 'James',
  'Anna', 'Chris', 'Mia', 'Ryan', 'Sophie', 'Kevin', 'Olivia',
  'Daniel', 'Chloe', 'Mark', 'Amy', 'Tom', 'Jessica',
];

const LAST_NAMES = [
  'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui',
  'Do', 'Ngo', 'Ly', 'Truong', 'Dinh', 'Duong', 'Luong',
  'Smith', 'Johnson', 'Lee', 'Kim', 'Park', 'Chen', 'Wang',
];

const REVIEW_COMMENTS = [
  'Phim hay quá, xem đi mọi người!',
  'Kịch bản hơi yếu nhưng diễn xuất tốt.',
  'Đáng xem, 10/10 recommend!',
  'Hình ảnh đẹp, nhạc phim tuyệt vời.',
  'Hơi dài nhưng đáng xem đến cuối.',
  'Great movie, loved every minute!',
  'The plot twist was unexpected, brilliant!',
  'Not my cup of tea, but decent production.',
  'Amazing cinematography and soundtrack.',
  'Could have been better, felt rushed at the end.',
  'One of the best films I have seen this year.',
  'Nhạc nền rất hay, phù hợp với cảnh phim.',
  'Diễn viên chính diễn xuất quá tốt.',
  'Phim giải trí nhẹ nhàng, xem cuối tuần.',
  'Cốt truyện hấp dẫn từ đầu đến cuối.',
  null,
  null,
  null,
];

const COMMENT_CONTENTS = [
  'Ai biết phim này có phần 2 không?',
  'Cảnh cuối phim quá đỉnh!',
  'Diễn viên nữ chính xinh quá!',
  'Nhạc phim hay lắm, ai biết tên bài không?',
  'Phim này nên xem ở rạp mới đã.',
  'Mình thích đoạn chiến đấu nhất.',
  'Plot twist cuối phim ai đoán được?',
  'Does anyone know the OST name?',
  'The ending was so emotional, I cried.',
  'Best action sequences I have ever seen!',
  'This movie reminded me of my childhood.',
  'Can we talk about that amazing score?',
  'Xem xong muốn xem lại lần nữa.',
  'Phim này hay hơn mình tưởng nhiều.',
  'Recommend cho ai thích thể loại này.',
  'Tình tiết phim khá bất ngờ.',
  'Mình xem 3 lần rồi vẫn thích.',
  'Ai xem chưa, cho mình xin review?',
  'Phần kỹ xảo phim làm rất tốt.',
  'Phim này đáng đồng tiền bát gạo.',
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ── Ensure roles exist ──────────────────────────
    const roles = ['ADMIN', 'USER', 'VIP'] as const;
    for (const name of roles) {
      await prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, description: `${name} role` },
      });
    }
    const allRoles = await prisma.role.findMany();
    const userRole = allRoles.find((r) => r.name === 'USER')!;
    const vipRole = allRoles.find((r) => r.name === 'VIP')!;
    console.log('✓ Roles ensured');

    // ── Create users spread over 90 days ────────────
    const password = await bcrypt.hash('User@123', 10);
    const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const newUserCount = 45;
    const createdUsers: { id: string }[] = [];

    for (let i = 0; i < newUserCount; i++) {
      const first = pickRandom(FIRST_NAMES);
      const last = pickRandom(LAST_NAMES);
      const email = `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 999)}@example.com`;

      if (existingEmails.has(email)) continue;

      const daysAgo = randomInt(0, 90);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      // Add some time variance within the day
      createdAt.setHours(randomInt(6, 23), randomInt(0, 59), randomInt(0, 59));

      const user = await prisma.user.create({
        data: {
          email,
          password,
          fullName: `${first} ${last}`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${first}${last}${i}`,
          isActive: Math.random() > 0.05, // 95% active
          createdAt,
          updatedAt: createdAt,
        },
      });

      // Assign USER role to all
      await prisma.userRole.create({
        data: { userId: user.id, roleId: userRole.id },
      });

      // 20% get VIP
      if (Math.random() < 0.2) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: vipRole.id },
        });
      }

      createdUsers.push({ id: user.id });
      existingEmails.add(email);
    }

    console.log(`✓ Created ${createdUsers.length} new users`);

    // Collect all user IDs
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const userIds = allUsers.map((u) => u.id);

    // ── Get movies ──────────────────────────────────
    const movies = await prisma.movie.findMany({
      select: { id: true, durationMinutes: true },
    });
    if (movies.length === 0) {
      console.log('✗ No movies found. Run TMDB seed first.');
      return;
    }
    console.log(`  Found ${movies.length} movies, ${userIds.length} users`);

    // ── Reviews (spread over 60 days) ───────────────
    let reviewCount = 0;
    const reviewPairs = new Set<string>();

    for (let i = 0; i < 300; i++) {
      const userId = pickRandom(userIds);
      const movie = pickRandom(movies);
      const key = `${userId}:${movie.id}`;
      if (reviewPairs.has(key)) continue;
      reviewPairs.add(key);

      await prisma.review.create({
        data: {
          userId,
          movieId: movie.id,
          rating: randomInt(1, 10),
          comment: pickRandom(REVIEW_COMMENTS),
          createdAt: randomDate(60),
        },
      });
      reviewCount++;
    }
    console.log(`✓ Created ${reviewCount} reviews`);

    // ── Comments (spread over 45 days) ──────────────
    let commentCount = 0;
    for (let i = 0; i < 250; i++) {
      const createdAt = randomDate(45);
      await prisma.comment.create({
        data: {
          userId: pickRandom(userIds),
          movieId: pickRandom(movies).id,
          content: pickRandom(COMMENT_CONTENTS),
          isSpoiler: Math.random() < 0.15,
          createdAt,
          updatedAt: createdAt,
        },
      });
      commentCount++;
    }
    console.log(`✓ Created ${commentCount} comments`);

    // ── Watch History (spread over 90 days) ─────────
    let watchCount = 0;
    const watchPairs = new Set<string>();

    for (let i = 0; i < 800; i++) {
      const userId = pickRandom(userIds);
      const movie = pickRandom(movies);
      const key = `${userId}:${movie.id}`;
      if (watchPairs.has(key)) continue;
      watchPairs.add(key);

      const duration = (movie.durationMinutes ?? 120) * 60;
      const isFinished = Math.random() < 0.35;
      const progress = isFinished
        ? duration
        : randomInt(Math.floor(duration * 0.05), Math.floor(duration * 0.95));

      await prisma.watchHistory.create({
        data: {
          userId,
          movieId: movie.id,
          progressSeconds: progress,
          isFinished,
          lastWatchedAt: randomDate(90),
        },
      });
      watchCount++;
    }
    console.log(`✓ Created ${watchCount} watch history entries`);

    // ── Watchlist entries (spread over 60 days) ─────
    let watchlistCount = 0;
    const watchlistPairs = new Set<string>();

    for (let i = 0; i < 350; i++) {
      const userId = pickRandom(userIds);
      const movie = pickRandom(movies);
      const key = `${userId}:${movie.id}`;
      if (watchlistPairs.has(key)) continue;
      watchlistPairs.add(key);

      await prisma.watchlist.create({
        data: {
          userId,
          movieId: movie.id,
          createdAt: randomDate(60),
        },
      });
      watchlistCount++;
    }
    console.log(`✓ Created ${watchlistCount} watchlist entries`);

    // ── Subscriptions ───────────────────────────────
    const plans = ['Basic', 'Standard', 'Premium'];
    let subCount = 0;

    // Pick ~30% of users for subscriptions
    const subUsers = pickRandomN(userIds, Math.floor(userIds.length * 0.3));
    for (const userId of subUsers) {
      const startDate = randomDate(90);
      const durationDays = pickRandom([30, 90, 365]);
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      let status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
      if (endDate < now) {
        status = Math.random() < 0.7 ? 'EXPIRED' : 'CANCELLED';
      } else {
        status = Math.random() < 0.9 ? 'ACTIVE' : 'CANCELLED';
      }

      await prisma.subscription.create({
        data: {
          userId,
          planName: pickRandom(plans),
          startDate,
          endDate,
          status,
          createdAt: startDate,
        },
      });
      subCount++;
    }
    console.log(`✓ Created ${subCount} subscriptions`);

    // ── Summary ─────────────────────────────────────
    const finalCounts = {
      users: await prisma.user.count(),
      movies: await prisma.movie.count(),
      reviews: await prisma.review.count(),
      comments: await prisma.comment.count(),
      watchHistory: await prisma.watchHistory.count(),
      watchlist: await prisma.watchlist.count(),
      subscriptions: await prisma.subscription.count(),
    };
    console.log('\n📊 Final counts:', JSON.stringify(finalCounts, null, 2));
    console.log('\n✅ Analytics seed complete!');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
