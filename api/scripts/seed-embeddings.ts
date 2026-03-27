/**
 * Seed script — generate embeddings for all movies without embeddings.
 *
 * Usage:
 *   pnpm run seed:embeddings
 *   # or: ts-node -r tsconfig-paths/register scripts/seed-embeddings.ts
 *
 * - Loads embedding model once (~2-3s warm-up, ~80MB download on first run)
 * - Processes movies in batches of 50
 * - Idempotent: skips movies that already have embeddings
 * - No API key required — 100% local inference
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const BATCH_SIZE = parseInt(process.env.EMBEDDING_BATCH_SIZE ?? '50', 10);
const MODEL_NAME = process.env.EMBEDDING_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
const DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS ?? '384', 10);

type FeatureExtractionPipeline = (
  text: string | string[],
  options: { pooling: string; normalize: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

function generateMovieText(movie: {
  title: string;
  description?: string | null;
  genres?: { genre: { name: string } }[];
  cast?: { role: string; person: { name: string } }[];
}): string {
  const parts: string[] = [`Title: ${movie.title}.`];

  if (movie.genres?.length) {
    parts.push(`Genres: ${movie.genres.map((g) => g.genre.name).join(', ')}.`);
  }

  const directors = movie.cast
    ?.filter((c) => c.role === 'DIRECTOR')
    .map((c) => c.person.name);
  if (directors?.length) parts.push(`Director: ${directors.join(', ')}.`);

  const actors = movie.cast
    ?.filter((c) => c.role === 'ACTOR')
    .slice(0, 5)
    .map((c) => c.person.name);
  if (actors?.length) parts.push(`Cast: ${actors.join(', ')}.`);

  if (movie.description) {
    parts.push(`Description: ${movie.description.slice(0, 200)}`);
  }

  return parts.join(' ');
}

async function main() {
  const prisma = new PrismaClient();

  console.log(`Loading embedding model: ${MODEL_NAME}...`);
  const { pipeline } = await import('@huggingface/transformers');
  const extractor = (await pipeline(
    'feature-extraction',
    MODEL_NAME,
  )) as unknown as FeatureExtractionPipeline;
  console.log('Model ready.\n');

  const movies = await prisma.movie.findMany({
    include: {
      genres: { include: { genre: true } },
      cast: { include: { person: true } },
    },
  });

  // Find movies without embeddings
  const existing = await prisma.$queryRaw<{ movie_id: string }[]>`
    SELECT movie_id FROM movie_embeddings
  `;
  const existingIds = new Set(existing.map((r) => r.movie_id));
  const toEmbed = movies.filter((m) => !existingIds.has(m.id));

  if (toEmbed.length === 0) {
    console.log('✓ All movies already have embeddings. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Found ${toEmbed.length} movies without embeddings (${existingIds.size} already done).\n`,
  );

  const start = Date.now();
  let processed = 0;

  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const texts = batch.map((m) => generateMovieText(m));

    // Batch inference
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    const flat = Array.from(output.data);

    for (let j = 0; j < batch.length; j++) {
      const vector = flat.slice(j * DIMENSIONS, (j + 1) * DIMENSIONS);
      const vectorLiteral = `[${vector.join(',')}]`;
      await prisma.$executeRaw`
        INSERT INTO movie_embeddings (movie_id, embedding, metadata, updated_at)
        VALUES (
          ${batch[j].id},
          ${vectorLiteral}::vector,
          ${JSON.stringify({ title: batch[j].title })}::jsonb,
          NOW()
        )
        ON CONFLICT (movie_id) DO UPDATE SET
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `;
    }

    processed += batch.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `Embedded ${processed}/${toEmbed.length} movies... (${elapsed}s elapsed)`,
    );
  }

  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Done: embedded ${processed} movies in ${total}s`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
