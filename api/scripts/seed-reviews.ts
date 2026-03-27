import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Seed realistic reviews (rating 1-5 + optional comment) and
 * discussion comments (with spoiler flag) for all movies.
 *
 * Safe to run multiple times — uses upsert for reviews.
 */

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const ms = Date.now() - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  d.setHours(randomInt(6, 23), randomInt(0, 59), randomInt(0, 59));
  return d;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Review comments (text kèm rating) ───────────────────────────────────────
// Nhóm theo mức rating để câu văn phù hợp cảm xúc
const REVIEW_TEXT_BY_RATING: Record<number, (string | null)[]> = {
  5: [
    'Tuyệt vời! Một trong những bộ phim hay nhất tôi từng xem.',
    'Xuất sắc từ đầu đến cuối. Diễn xuất, kịch bản, hình ảnh đều đỉnh.',
    'Không thể tin được phim hay đến vậy. 10/10 recommend!',
    'Masterpiece! Cần được xem ở rạp mới cảm nhận được hết.',
    'Phim xúc động thật sự, xem xong vẫn còn nghĩ mãi.',
    'Perfect movie. Every scene was crafted with intention.',
    'This is cinema at its finest. Absolutely breathtaking.',
    'Flawless storytelling, brilliant performances. A must-watch.',
    'One of the greatest films ever made. Changed my perspective on life.',
    'Can\'t stop thinking about this film. Pure perfection.',
    null,
  ],
  4: [
    'Phim rất hay, kịch bản chắc chắn và diễn xuất tốt.',
    'Xem rất đáng, dù có vài điểm nhỏ chưa hoàn hảo.',
    'Phần hình ảnh và âm nhạc rất ấn tượng.',
    'Hấp dẫn từ đầu đến gần cuối, đoạn kết hơi vội.',
    'Rất recommend cho ai thích thể loại này.',
    'Great movie overall. A few pacing issues but nothing major.',
    'Strong performances and beautiful cinematography. Highly recommended.',
    'Nearly perfect — just a couple of slow moments in the middle.',
    'Very well made. The ending could have been stronger.',
    'Enjoyable experience. Will definitely rewatch.',
    null,
    null,
  ],
  3: [
    'Phim ổn, không quá xuất sắc nhưng đáng xem một lần.',
    'Kịch bản bình thường, diễn xuất tạm được.',
    'Xem giải trí cuối tuần thì được, đừng kỳ vọng quá.',
    'Có một số cảnh hay nhưng tổng thể chưa thuyết phục.',
    'Mình mong đợi nhiều hơn sau khi đọc review.',
    'Decent movie. Nothing groundbreaking but enjoyable.',
    'Average film with some bright moments. Worth a watch.',
    'Not bad, not great. Somewhere in the middle.',
    'It had potential but didn\'t quite deliver on it.',
    null,
    null,
  ],
  2: [
    'Phim hơi thất vọng so với kỳ vọng ban đầu.',
    'Kịch bản nhiều lỗ hổng, diễn xuất chưa tốt.',
    'Phần đầu hay nhưng nửa sau xuống dốc rõ rệt.',
    'Nhiều cảnh không cần thiết, phim quá dài.',
    'Không giống như trailer quảng cáo.',
    'Disappointing. Expected much more based on the hype.',
    'Poor script with some good visuals. Not worth the time.',
    'The first half was promising but it fell apart.',
    null,
    null,
  ],
  1: [
    'Phim rất tệ, lãng phí thời gian.',
    'Kịch bản vô lý, không thể xem được.',
    'Thất vọng hoàn toàn. Không recommend.',
    'Worst movie I have seen in a long time.',
    'Painful to sit through. Avoid this one.',
    null,
  ],
};

// ─── Discussion comments (không gắn rating) ──────────────────────────────────
const COMMENT_CONTENTS = [
  // Câu hỏi / thảo luận
  'Ai biết phim này có phần 2 không vậy?',
  'Cảnh cuối phim ai hiểu ý nghĩa giải thích giúp mình với!',
  'Nhạc phim hay lắm, ai biết tên bài nhạc nền không?',
  'Phim này nên xem ở rạp hay xem ở nhà thì tốt hơn?',
  'Mình chưa xem, phim có cần biết gì trước không?',
  'Does anyone know if there\'s a sequel planned?',
  'Can someone explain the ending? I\'m confused.',
  'What\'s the name of the song during the final scene?',
  // Reaction / cảm nhận
  'Cảnh chiến đấu cuối phim đỉnh quá!',
  'Mình khóc ở cảnh đó, ai cũng vậy không?',
  'Plot twist cuối phim không ai đoán được!',
  'Diễn viên chính diễn quá đỉnh, xứng đáng thắng giải.',
  'Xem xong vẫn cảm thấy bâng khuâng.',
  'The cinematography in this film is absolutely stunning.',
  'That plot twist caught me completely off guard!',
  'The lead actor deserves every award for this performance.',
  'I\'m still thinking about that ending. So powerful.',
  'Best action sequences I have seen in years.',
  // Recommend
  'Recommend cho ai thích phim tâm lý.',
  'Mình xem 3 lần rồi vẫn thấy hay.',
  'Cả nhóm mình xem đều thích, đáng xem lắm!',
  'Highly recommend to anyone who enjoys this genre.',
  'Watched it twice already. Still just as good.',
  // Casual / ngắn
  'Phim hay lắm mọi người ơi!',
  'Tuyệt vời 🔥',
  'Đỉnh thật!',
  'So good!!',
  'Loved it!',
];

// ─── Spoiler comments ─────────────────────────────────────────────────────────
const SPOILER_CONTENTS = [
  'Hoá ra nhân vật phản diện là người thân của nhân vật chính!',
  'Kết thúc phim: nhân vật chính hy sinh để cứu mọi người.',
  'Cảnh after-credit hé lộ phần 2 với villain mới.',
  'Twist lớn nhất: tất cả chỉ là giấc mơ của nhân vật chính.',
  'The villain turns out to be the hero\'s long-lost sibling.',
  'The post-credits scene sets up a sequel with a new threat.',
  'Major twist: the entire story was a simulation.',
  'The real killer was the detective investigating the case.',
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ── Load existing users & movies ────────────────
    const users = await prisma.user.findMany({ select: { id: true } });
    const movies = await prisma.movie.findMany({ select: { id: true, title: true } });

    if (users.length === 0) {
      console.log('✗ No users found. Run seed-admin + seed-analytics first.');
      return;
    }
    if (movies.length === 0) {
      console.log('✗ No movies found. Run TMDB seed first.');
      return;
    }

    const userIds = users.map((u) => u.id);
    console.log(`  Found ${users.length} users, ${movies.length} movies`);

    // ── Reviews (upsert — safe to re-run) ───────────
    // Target: each movie gets ~8-15 reviews with varied ratings
    let reviewCount = 0;
    const reviewPairs = new Set<string>();

    // Pre-load existing pairs to avoid redundant upserts
    const existing = await prisma.review.findMany({ select: { userId: true, movieId: true } });
    for (const r of existing) reviewPairs.add(`${r.userId}:${r.movieId}`);

    for (const movie of movies) {
      const targetReviews = randomInt(8, 15);
      const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(targetReviews, shuffledUsers.length); i++) {
        const userId = shuffledUsers[i];
        const key = `${userId}:${movie.id}`;
        if (reviewPairs.has(key)) continue;
        reviewPairs.add(key);

        // Weight ratings toward 3-5 (more realistic distribution)
        const ratingWeights = [1, 1, 2, 3, 3]; // 1★ x1, 2★ x1, 3★ x2, 4★ x3, 5★ x3
        const ratingPool = ratingWeights.flatMap((w, idx) => Array(w).fill(idx + 1)) as number[];
        const rating = pickRandom(ratingPool) as number;
        const commentPool = REVIEW_TEXT_BY_RATING[rating];

        await prisma.review.upsert({
          where: { userId_movieId: { userId, movieId: movie.id } },
          create: {
            userId,
            movieId: movie.id,
            rating,
            comment: pickRandom(commentPool),
            createdAt: randomDate(90),
          },
          update: {},
        });
        reviewCount++;
      }
    }
    console.log(`✓ Seeded ${reviewCount} new reviews`);

    // ── Comments (append-only) ───────────────────────
    // Target: each movie gets ~5-12 discussion comments
    let commentCount = 0;

    for (const movie of movies) {
      const targetComments = randomInt(5, 12);

      for (let i = 0; i < targetComments; i++) {
        const isSpoiler = Math.random() < 0.12; // 12% spoiler rate
        const content = isSpoiler ? pickRandom(SPOILER_CONTENTS) : pickRandom(COMMENT_CONTENTS);
        const createdAt = randomDate(60);

        await prisma.comment.create({
          data: {
            userId: pickRandom(userIds),
            movieId: movie.id,
            content,
            isSpoiler,
            createdAt,
            updatedAt: createdAt,
          },
        });
        commentCount++;
      }
    }
    console.log(`✓ Seeded ${commentCount} new comments`);

    // ── Summary ─────────────────────────────────────
    const [totalReviews, totalComments] = await Promise.all([
      prisma.review.count(),
      prisma.comment.count(),
    ]);

    // Rating distribution across all reviews
    const allReviews = await prisma.review.findMany({ select: { rating: true } });
    const dist = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: allReviews.filter((r) => r.rating === star).length,
    }));

    console.log('\n📊 Review stats:');
    console.log(`  Total reviews : ${totalReviews}`);
    console.log(`  Total comments: ${totalComments}`);
    console.log('  Rating distribution:');
    for (const { star, count } of dist.reverse()) {
      const pct = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(1) : '0';
      const bar = '█'.repeat(Math.round(count / Math.max(totalReviews / 30, 1)));
      console.log(`    ${star}★  ${bar} ${count} (${pct}%)`);
    }

    console.log('\n✅ Reviews seed complete!');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
