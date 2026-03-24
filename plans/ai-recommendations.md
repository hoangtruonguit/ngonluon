# AI-Powered Recommendations — Implementation Plan

## Mục tiêu

Xây dựng hệ thống gợi ý phim thông minh dựa trên:
- **Content-Based Filtering**: Vector embeddings cho mỗi phim (genre, cast, description, metadata)
- **Collaborative Filtering**: Phân tích hành vi xem của nhiều users để tìm patterns chung
- **Personalization**: Kết hợp watch history, watchlist, reviews để tạo user profile vector

**Skills showcase**: AI/ML integration, vector embeddings (pgvector), local inference (Transformers.js), similarity search, personalization algorithms, caching strategies.

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ "For You"    │  │ "Because you │  │ "Users also        │ │
│  │ Homepage Row │  │ watched X"   │  │  watched"          │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘ │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   API (NestJS)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            RecommendationsController                  │   │
│  │  GET /recommendations/for-you                         │   │
│  │  GET /recommendations/because-you-watched/:movieId    │   │
│  │  GET /recommendations/similar/:movieId                │   │
│  │  GET /recommendations/trending-for-you                │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │            RecommendationsService                     │   │
│  │  - buildUserProfile(userId)                           │   │
│  │  - getForYou(userId, limit)                           │   │
│  │  - getBecauseYouWatched(userId, movieId, limit)       │   │
│  │  - getSimilarByEmbedding(movieId, limit)              │   │
│  │  - getTrendingForYou(userId, limit)                   │   │
│  └───────┬────────────┬──────────────┬──────────────────┘   │
│          │            │              │                        │
│  ┌───────▼──────┐ ┌──▼──────────┐ ┌─▼───────────────────┐  │
│  │ Embedding    │ │ Redis       │ │ Recommendations     │  │
│  │ Service      │ │ Cache       │ │ Repository          │  │
│  │(Transformers │ │ (TTL:1h)    │ │ (pgvector queries)  │  │
│  │    .js)      │ └─────────────┘ └─────────┬───────────┘  │
│  └───────┬──────┘                           │               │
│          │                          ┌────────▼──────────┐   │
│  ┌───────▼──────────┐               │ PostgreSQL        │   │
│  │ Local Model      │               │ + pgvector        │   │
│  │ all-MiniLM-L6-v2 │               │ (cosine similarity│   │
│  │ (384 dims, ~80MB)│               │  search)          │   │
│  │ Cached on disk   │               └───────────────────┘   │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

**Key advantage**: Model chạy 100% local trong Node.js process — không cần API key, không tốn tiền, không phụ thuộc external service, hoạt động offline.

---

## Phase 0: Infrastructure Setup — pgvector + Transformers.js

### 0.1 Cài đặt pgvector extension

**File: `docker-compose.yml`**
- Đổi image PostgreSQL sang `pgvector/pgvector:pg15` (drop-in replacement, thêm vector extension)

**File: `api/prisma/migrations/XXXXXX_add_pgvector/migration.sql`**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 0.2 Cài đặt dependencies

**API (`api/package.json`)**:
```bash
pnpm add @huggingface/transformers pgvector
```

- `@huggingface/transformers` — Chạy ML models trực tiếp trong Node.js (ONNX Runtime), không cần API key
- `pgvector` — Helper để serialize/deserialize vectors trong Prisma raw queries

> **Model**: `Xenova/all-MiniLM-L6-v2` — sentence-transformers model phổ biến nhất cho semantic similarity.
> - **384 dimensions** (compact, hiệu quả cho pgvector)
> - **~80MB** download lần đầu, cache trên disk (`~/.cache/huggingface/`)
> - **~50-100ms/text** trên CPU — đủ nhanh cho batch processing
> - **Free, open-source** (Apache 2.0 license)

### 0.3 Environment variables

**File: `api/.env.example`**
```env
# AI Recommendations (all optional — sensible defaults provided)
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2    # HuggingFace model ID (local inference)
EMBEDDING_DIMENSIONS=384                     # Must match model output dimensions
EMBEDDING_BATCH_SIZE=50                      # Movies per batch during seed
```

**File: `api/src/common/config/env.validation.ts`**
- Thêm optional: `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `EMBEDDING_BATCH_SIZE`
- Không cần API key nào

### 0.4 Model warm-up strategy

Model `all-MiniLM-L6-v2` cần download ~80MB lần đầu tiên. Strategies:
- **Dev**: Model tự download khi `EmbeddingService.onModuleInit()` chạy lần đầu, cache tại `~/.cache/huggingface/`
- **Docker/CI**: Thêm step `pnpm run warm-model` trong Dockerfile để pre-download
- **Subsequent starts**: Load từ cache, ~2-3s warm-up (ONNX Runtime init)

### Deliverables Phase 0
- [ ] docker-compose.yml dùng pgvector image
- [ ] Migration enable pgvector extension
- [ ] `@huggingface/transformers` + `pgvector` packages installed
- [ ] Env vars configured (no API keys needed)

---

## Phase 1: Embedding Service + Movie Embeddings

### 1.1 Prisma schema — MovieEmbedding table

**File: `api/prisma/schema.prisma`**

```prisma
/// Stores vector embeddings for movies (managed via raw SQL for pgvector support)
/// Table: movie_embeddings
/// Columns: id, movie_id (FK → movies.id), embedding (vector(384)), metadata (jsonb), created_at, updated_at
```

> **Lưu ý**: Prisma chưa native support `vector` type → dùng migration SQL thủ công, query bằng `$queryRaw`.

**File: `api/prisma/migrations/XXXXXX_add_movie_embeddings/migration.sql`**
```sql
CREATE TABLE movie_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  embedding vector(384) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(movie_id)
);

-- HNSW index for fast cosine similarity search (top-k queries)
CREATE INDEX idx_movie_embeddings_hnsw
  ON movie_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 1.2 EmbeddingService

**File: `api/src/recommendations/embedding.service.ts`**

```typescript
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private extractor: FeatureExtractionPipeline;
  private readonly logger = new Logger(EmbeddingService.name);

  async onModuleInit() {
    // Load model on startup — downloads ~80MB on first run, cached afterward
    this.logger.log('Loading embedding model...');
    this.extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );
    this.logger.log('Embedding model ready');
  }

  generateMovieText(movie): string
  // Tạo text representation cho movie:
  // "Title: Inception. Genres: Sci-Fi, Action, Thriller.
  //  Director: Christopher Nolan. Cast: Leonardo DiCaprio, ...
  //  Description: A thief who steals corporate secrets..."
  // → Concatenate metadata thành 1 đoạn text ngắn gọn (~200 chars)
  // Giữ ngắn vì all-MiniLM-L6-v2 tối ưu cho short texts (< 256 tokens)

  async embedText(text: string): Promise<number[]>
  // const output = await this.extractor(text, { pooling: 'mean', normalize: true });
  // return Array.from(output.data);  // Float32Array → number[]
  // → Returns 384-dim normalized vector

  async embedMany(texts: string[]): Promise<number[][]>
  // Process in batches (extractor supports batch input)
  // const output = await this.extractor(texts, { pooling: 'mean', normalize: true });
  // Split output into individual vectors
  // ~50-100ms per text on CPU

  async embedMovie(movieId: string): Promise<void>
  // 1. Load movie + genres + cast from DB
  // 2. generateMovieText(movie)
  // 3. embedText(text)
  // 4. Upsert vào movie_embeddings table (raw SQL with pgvector)

  async embedAllMovies(): Promise<void>
  // Batch embed tất cả movies chưa có embedding
  // Process in batches of 50
  // Log progress: "Embedded 50/290 movies..."
  // Total time estimate: ~290 movies × 80ms = ~23 seconds
}
```

### 1.3 Seed script — Generate embeddings cho existing movies

**File: `api/scripts/seed-embeddings.ts`**
- Load model once
- Load all movies without embeddings
- Batch embed (50 movies/batch)
- Không cần delay giữa batches (local inference, no rate limit)
- Log progress: `Embedded 50/290 movies... (23s elapsed)`
- Idempotent: skip movies that already have embeddings

### 1.4 Event listener — Auto-embed new movies

**File: `api/src/recommendations/recommendation-sync.listener.ts`**
- Listen to `MovieCreatedEvent` → embed immediately (local, ~100ms)
- Listen to `MovieUpdatedEvent` → re-embed if title/genre/cast changed
- Listen to `MovieDeletedEvent` → delete embedding record
- Không cần RabbitMQ queue vì local inference đủ nhanh (~100ms/movie)
- Fallback: nếu embedding fails, log warning và skip (non-critical)

### Deliverables Phase 1
- [ ] movie_embeddings table + HNSW index (384 dims)
- [ ] EmbeddingService với Transformers.js (local inference)
- [ ] Seed script cho existing movies
- [ ] Event listeners cho auto-embed

---

## Phase 2: User Profile Vector + Content-Based Recommendations

### 2.1 User Preference Profile

**Concept**: Tạo "user taste vector" bằng cách weighted average các movie embeddings mà user đã tương tác.

**Scoring formula cho mỗi movie interaction:**
```
weight = 0
if watched && isFinished:    weight += 3.0   (hoàn thành = thích nhất)
if watched && !isFinished:   weight += 1.0   (xem dở = hơi thích)
if in watchlist:             weight += 2.0   (muốn xem = implicit interest)
if reviewed with rating >= 4: weight += 2.5  (đánh giá cao)
if reviewed with rating <= 2: weight -= 2.0  (không thích → negative signal)

recency_boost = 1.0 / (1 + days_since_interaction / 30)
// Interactions gần đây được boost cao hơn

final_weight = weight * recency_boost
```

**User profile vector** = weighted average of movie embeddings:
```
user_vector = Σ (weight_i * movie_embedding_i) / Σ |weight_i|
```

### 2.2 RecommendationsRepository

**File: `api/src/recommendations/recommendations.repository.ts`**

```typescript
@Injectable()
export class RecommendationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Movie similarity queries (pgvector) ──────────

  findSimilarMovies(movieId: string, limit: number, excludeIds?: string[])
  // SELECT m.*, 1 - (me.embedding <=> target.embedding) AS similarity
  // FROM movie_embeddings me
  // JOIN movies m ON m.id = me.movie_id
  // CROSS JOIN (SELECT embedding FROM movie_embeddings WHERE movie_id = $1) target
  // WHERE me.movie_id != $1
  //   AND me.movie_id NOT IN ($excludeIds)
  // ORDER BY me.embedding <=> target.embedding
  // LIMIT $2

  findByUserVector(userVector: number[], limit: number, excludeIds: string[])
  // SELECT m.*, 1 - (me.embedding <=> $1::vector) AS similarity
  // FROM movie_embeddings me
  // JOIN movies m ON m.id = me.movie_id
  // WHERE me.movie_id NOT IN ($excludeIds)
  // ORDER BY me.embedding <=> $1::vector
  // LIMIT $2

  // ─── Collaborative filtering queries ──────────────

  findUsersWithSimilarTaste(userId: string, limit: number)
  // Users who watched/rated the same movies similarly
  // Uses overlap of watch history + similar ratings

  findPopularAmongSimilarUsers(userId: string, similarUserIds: string[], excludeIds: string[], limit: number)
  // Movies popular among similar users that current user hasn't seen

  // ─── User interaction data ────────────────────────

  getUserInteractions(userId: string)
  // Returns: { movieId, weight, embedding } for building user profile vector
  // Joins: watch_history + watchlist + reviews + movie_embeddings

  getWatchedMovieIds(userId: string): Promise<string[]>
  // All movie IDs user has watched (for exclusion)
}
```

### 2.3 RecommendationsService

**File: `api/src/recommendations/recommendations.service.ts`**

```typescript
@Injectable()
export class RecommendationsService {

  // ─── Core recommendation methods ──────────────────

  async getForYou(userId: string, limit = 20): Promise<MovieRecommendation[]>
  // 1. Build user profile vector (cached in Redis, TTL: 1h)
  // 2. Get watchedMovieIds (exclude already seen)
  // 3. Query pgvector: findByUserVector(userVector, limit * 2, watchedIds)
  // 4. Mix in collaborative filtering results (30% weight)
  // 5. Apply diversity: no more than 3 movies from same genre in top 10
  // 6. Return top N with similarity scores
  // Cache final result in Redis (TTL: 1h, key: rec:foryou:{userId})

  async getBecauseYouWatched(userId: string, movieId: string, limit = 10): Promise<MovieRecommendation[]>
  // 1. Get embedding of source movie
  // 2. findSimilarMovies(movieId, limit, watchedIds)
  // 3. Return with similarity scores + reason: "Because you watched {movieTitle}"
  // Cache: Redis TTL 2h, key: rec:byw:{userId}:{movieId}

  async getSimilarMovies(movieId: string, limit = 10): Promise<MovieRecommendation[]>
  // Public endpoint (no auth required)
  // Pure content-based: findSimilarMovies(movieId, limit)
  // Replaces current genre-based getSimilarMovies in MoviesService
  // Cache: Redis TTL 6h, key: rec:similar:{movieId}

  async getTrendingForYou(userId: string, limit = 10): Promise<MovieRecommendation[]>
  // 1. Get trending movies (most watched in last 7 days)
  // 2. Re-rank by user profile similarity
  // 3. Trending movies that match user taste float to top
  // Cache: Redis TTL 30m, key: rec:trending:{userId}

  // ─── User profile ────────────────────────────────

  async buildUserProfile(userId: string): Promise<number[]>
  // 1. Get all user interactions with weights (see formula in 2.1)
  // 2. Weighted average of movie embeddings
  // 3. Cache in Redis (TTL: 1h, key: profile:{userId})
  // 4. Return user vector (384 dims)

  async invalidateUserProfile(userId: string): Promise<void>
  // Delete Redis cache for user profile + recommendation results
  // Called when user watches/rates/adds to watchlist

  // ─── Collaborative filtering ─────────────────────

  private async getCollaborativeRecommendations(userId: string, limit: number, excludeIds: string[]): Promise<MovieRecommendation[]>
  // 1. Find similar users (top 20 by watch overlap + rating correlation)
  // 2. Get movies popular among similar users that current user hasn't seen
  // 3. Score by: (# similar users who watched) * (avg rating by similar users)
  // 4. Return top N
}
```

### 2.4 Interfaces

**File: `api/src/recommendations/interfaces/recommendation.interfaces.ts`**

```typescript
export interface MovieRecommendation {
  movie: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
    releaseYear: number | null;
    rating: number;
    type: string;
    genres: string[];
    isPremium: boolean;
  };
  score: number;          // 0-1 similarity/relevance score
  reason?: string;        // "Because you watched Inception"
  source: 'content' | 'collaborative' | 'trending' | 'similar';
}

export interface UserProfile {
  userId: string;
  vector: number[];       // 384 dims
  interactionCount: number;
  topGenres: string[];    // Top 5 genres by watch frequency
  updatedAt: Date;
}
```

### Deliverables Phase 2
- [ ] RecommendationsRepository (pgvector queries + collaborative queries)
- [ ] RecommendationsService (all recommendation algorithms)
- [ ] User profile vector computation with weighted interactions
- [ ] Redis caching layer for all recommendation results
- [ ] Interfaces/DTOs

---

## Phase 3: API Endpoints + Cache Invalidation

### 3.1 RecommendationsController

**File: `api/src/recommendations/recommendations.controller.ts`**

```typescript
@Controller('recommendations')
export class RecommendationsController {

  @Get('for-you')          // Auth required
  @UseGuards(JwtAuthGuard)
  getForYou(@Req() req, @Query('limit') limit?: number)
  // → service.getForYou(userId, limit)

  @Get('because-you-watched/:movieId')  // Auth required
  @UseGuards(JwtAuthGuard)
  getBecauseYouWatched(@Req() req, @Param('movieId') movieId: string, @Query('limit') limit?: number)
  // → service.getBecauseYouWatched(userId, movieId, limit)

  @Get('similar/:movieId')  // Public (no auth)
  getSimilar(@Param('movieId') movieId: string, @Query('limit') limit?: number)
  // → service.getSimilarMovies(movieId, limit)

  @Get('trending-for-you')  // Auth required
  @UseGuards(JwtAuthGuard)
  getTrendingForYou(@Req() req, @Query('limit') limit?: number)
  // → service.getTrendingForYou(userId, limit)
}
```

### 3.2 Cache invalidation via Event Listeners

**File: `api/src/recommendations/recommendation-cache.listener.ts`**

```typescript
// Invalidate user profile + recommendations when interactions change
@OnEvent('watch-history.saved')    → invalidateUserProfile(userId)
@OnEvent('watchlist.added')        → invalidateUserProfile(userId)
@OnEvent('watchlist.removed')      → invalidateUserProfile(userId)
@OnEvent('review.created')         → invalidateUserProfile(userId)
```

> **Lưu ý**: Cần emit events từ WatchHistoryService, WatchlistService, MoviesService (review) — thêm `EventEmitter2.emit()` vào các methods tương ứng.

### 3.3 RecommendationsModule

**File: `api/src/recommendations/recommendations.module.ts`**

```typescript
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationsRepository,
    EmbeddingService,
    RecommendationSyncListener,
    RecommendationCacheListener,
  ],
  exports: [RecommendationsService, EmbeddingService],
})
```

### Deliverables Phase 3
- [ ] 4 API endpoints (for-you, because-you-watched, similar, trending-for-you)
- [ ] Cache invalidation listeners
- [ ] Module registration in AppModule
- [ ] Events emitted from existing services

---

## Phase 4: Frontend — Recommendation UI Components

### 4.1 Recommendation Service

**File: `web/src/services/recommendation.service.ts`**

```typescript
export const recommendationService = {
  getForYou(limit?: number): Promise<MovieRecommendation[]>,
  getBecauseYouWatched(movieId: string, limit?: number): Promise<MovieRecommendation[]>,
  getSimilar(movieId: string, limit?: number): Promise<MovieRecommendation[]>,
  getTrendingForYou(limit?: number): Promise<MovieRecommendation[]>,
};
```

### 4.2 Homepage — "For You" Row

**File: `web/src/app/[locale]/(main)/page.tsx`** (update)

```
Existing rows:
  - Hero Carousel (trending)
  - Now Playing
  - New Releases

New rows (for authenticated users):
  + "Recommended For You"     ← getForYou(12)
  + "Trending For You"        ← getTrendingForYou(10)
  + "Because You Watched X"   ← getBecauseYouWatched(lastWatchedMovieId, 10)
```

### 4.3 RecommendationRow Component

**File: `web/src/components/movie/RecommendationRow.tsx`**

```typescript
// Reusable row component for recommendation sections
interface Props {
  title: string;
  movies: MovieRecommendation[];
  showReason?: boolean;     // Show "Because you watched..." text
  showScore?: boolean;      // Show match percentage (e.g., "95% match")
}

// Features:
// - Horizontal scroll carousel (same style as existing rows)
// - Match percentage badge (green for >80%, yellow >60%)
// - "Because you watched X" subtitle
// - Premium lock indicator
// - Skeleton loading state
```

### 4.4 Movie Detail Page — Similar Movies

**File: `web/src/app/[locale]/(main)/movies/[slug]/page.tsx`** (update)

Replace existing genre-based "Similar Movies" with AI-powered similar:
```
- getSimilarMovies(slug) → recommendationService.getSimilar(movieId)
- Show similarity score badge
```

### 4.5 i18n

**Files: `web/messages/en.json`, `web/messages/vi.json`**

```json
{
  "Recommendations": {
    "forYou": "Recommended For You",
    "becauseYouWatched": "Because You Watched {title}",
    "trendingForYou": "Trending For You",
    "similarMovies": "More Like This",
    "matchScore": "{score}% Match",
    "noRecommendations": "Watch some movies to get personalized recommendations!",
    "poweredByAI": "Powered by AI"
  }
}
```

### Deliverables Phase 4
- [ ] Recommendation service (frontend)
- [ ] RecommendationRow component with match scores
- [ ] Homepage updated with 3 recommendation rows
- [ ] Movie detail page — AI-powered similar movies
- [ ] i18n keys (en + vi)

---

## Phase 5: Cron Jobs + Admin Analytics

### 5.1 Scheduled tasks

**File: `api/src/recommendations/recommendations.cron.ts`**

```typescript
@Injectable()
export class RecommendationsCron {

  @Cron('0 3 * * *')  // Daily at 3 AM
  async recomputePopularProfiles()
  // Re-build user profiles for top 100 most active users
  // Pre-warm Redis cache

  @Cron('0 */6 * * *')  // Every 6 hours
  async embedNewMovies()
  // Find movies without embeddings → generate embeddings
  // Local inference → no API cost, no rate limit concerns
}
```

### 5.2 Admin analytics — Recommendation stats

**File: `api/src/admin/analytics/analytics.service.ts`** (update)

```typescript
async getRecommendationStats(): Promise<RecommendationStats> {
  return {
    totalEmbeddings: number,           // Movies with embeddings
    moviesWithoutEmbeddings: number,   // Movies missing embeddings
    avgInteractionsPerUser: number,    // Average engagement
    topRecommendedMovies: [...],       // Most frequently recommended
    coverageRate: number,              // % of catalog with embeddings
  };
}
```

### 5.3 Seed script — Generate all embeddings

**File: `api/scripts/seed-embeddings.ts`**

```typescript
// Usage: npx ts-node scripts/seed-embeddings.ts
// - Loads embedding model once (~2-3s)
// - Loads all movies without embeddings
// - Generates text representation for each
// - Embeds in batches of 50 (local inference, ~80ms/movie)
// - Stores vectors in movie_embeddings table
// - Total time: ~290 movies ≈ 25 seconds
// - Idempotent: skips already-embedded movies
// - No API key required
```

### Deliverables Phase 5
- [ ] Daily cron: re-compute active user profiles
- [ ] 6-hourly cron: embed new movies (local, free)
- [ ] Admin analytics endpoint for recommendation stats
- [ ] Seed script for initial embedding generation

---

## Phase 6: Testing + Graceful Degradation

### 6.1 Unit tests

**File: `api/src/recommendations/recommendations.service.spec.ts`**

- Test user profile vector computation (weighted average)
- Test genre diversity enforcement
- Test cache invalidation triggers
- Test graceful fallback when no embeddings exist
- Mock EmbeddingService (no actual model loading in tests)

### 6.2 Graceful degradation

Khi embedding model chưa tải xong hoặc embedding service lỗi:

```
getForYou()           → fallback to trending movies (by rating)
getBecauseYouWatched() → fallback to genre-based similar (existing logic)
getSimilar()          → fallback to genre-based similar (existing logic)
getTrendingForYou()   → fallback to global trending
```

- Log warning khi embedding model unavailable
- Không crash app — recommendation là optional enhancement
- Model auto-retry load on next request if initial load failed

### 6.3 Performance considerations

- **Model loading**: ~2-3s on startup (one-time), cached in memory
- **Inference**: ~50-100ms per text on CPU (acceptable for real-time single-movie embed)
- **Batch**: ~80ms/movie average when batching (seed script)
- **Memory**: ~200MB for model in memory (ONNX Runtime)
- **Disk**: ~80MB cached model files
- User recommendation refreshes: throttle to 1 per minute per user via Redis

### Deliverables Phase 6
- [ ] Unit tests for core algorithms
- [ ] Graceful fallback cho tất cả endpoints
- [ ] Performance monitoring + logging
- [ ] Error handling

---

## Data Flow Summary

```
User watches movie
      │
      ▼
WatchHistoryService.saveProgress()
      │
      ├──► emit('watch-history.saved', { userId })
      │         │
      │         ▼
      │    RecommendationCacheListener
      │         │
      │         ▼
      │    Redis: DELETE profile:{userId}, rec:foryou:{userId}, ...
      │
      ▼
Next request to GET /recommendations/for-you
      │
      ▼
RecommendationsService.getForYou(userId)
      │
      ├── Cache miss? Build user profile vector
      │     ├── Load watch_history + watchlist + reviews
      │     ├── Weight each interaction
      │     ├── Weighted avg of movie embeddings → user vector (384 dims)
      │     └── Cache in Redis (TTL: 1h)
      │
      ├── pgvector: ORDER BY embedding <=> user_vector LIMIT 20
      │
      ├── Collaborative: find similar users → their top movies
      │
      ├── Merge + deduplicate + diversity filter
      │
      └── Return top N recommendations
```

---

## Tech Stack cho Feature này

| Component | Technology | Lý do |
|-----------|-----------|-------|
| Embedding model | `Xenova/all-MiniLM-L6-v2` (local) | Free, 384 dims, chạy trong Node.js, không cần API key |
| ML runtime | `@huggingface/transformers` (ONNX) | Inference local, ~80ms/text, industry standard |
| Vector storage | PostgreSQL + pgvector | Không cần thêm DB mới, HNSW index nhanh |
| Similarity search | pgvector `<=>` (cosine distance) | Native SQL, HNSW ~5ms cho 10K vectors |
| Caching | Redis (existing) | User profiles + recommendation results |
| Async events | EventEmitter2 (existing) | Cache invalidation + auto-embed triggers |
| API framework | NestJS (existing) | Module + DI pattern |

---

## Chi phí

| Item | Cost |
|------|------|
| Embedding model | **$0** — open-source, local inference |
| pgvector | **$0** — PostgreSQL extension, already running |
| Compute | **$0** — runs on existing server CPU |
| API calls | **$0** — no external API needed |
| **Total** | **$0/month** |

> Nếu sau này muốn nâng cấp quality, có thể dễ dàng swap sang OpenAI `text-embedding-3-small` ($0.02/1M tokens) bằng cách chỉ thay đổi `EmbeddingService` — toàn bộ pipeline (pgvector, caching, recommendations) giữ nguyên.

---

## So sánh Model Options

| Model | Dims | Size | Speed | Quality | Cost |
|-------|------|------|-------|---------|------|
| **all-MiniLM-L6-v2** (chosen) | 384 | ~80MB | ~80ms | Good | Free |
| all-mpnet-base-v2 | 768 | ~420MB | ~200ms | Better | Free |
| OpenAI text-embedding-3-small | 512-1536 | API | ~100ms | Best | $0.02/1M tokens |

> `all-MiniLM-L6-v2` là sweet spot cho project này: đủ quality cho movie recommendations, nhẹ, nhanh, free.

---

## File Structure

```
api/src/recommendations/
├── recommendations.module.ts
├── recommendations.controller.ts
├── recommendations.service.ts
├── recommendations.repository.ts
├── recommendations.cron.ts
├── recommendations.service.spec.ts
├── embedding.service.ts                   # Transformers.js local inference
├── recommendation-sync.listener.ts        # Auto-embed new movies
├── recommendation-cache.listener.ts       # Invalidate cache on interactions
├── interfaces/
│   └── recommendation.interfaces.ts
└── dto/
    └── recommendation-query.dto.ts

web/src/
├── services/
│   └── recommendation.service.ts
├── components/movie/
│   └── RecommendationRow.tsx
```
