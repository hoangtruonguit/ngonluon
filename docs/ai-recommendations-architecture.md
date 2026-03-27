# AI Recommendation System — Kiến trúc kỹ thuật

## Tổng quan

Hệ thống gợi ý phim sử dụng **vector embeddings** và **pgvector** để cá nhân hoá nội dung cho từng user. Toàn bộ inference chạy **local** trong Node.js process — không cần API key, không tốn tiền, hoạt động offline.

| Thành phần | Công nghệ |
|---|---|
| Embedding model | `Xenova/all-MiniLM-L6-v2` (ONNX, 384 dims, ~80MB) |
| ML runtime | `@huggingface/transformers` (local inference) |
| Vector storage | PostgreSQL + `pgvector` extension |
| Similarity search | `<=>` cosine operator, HNSW index |
| Caching | Redis (profile 1h, for-you 1h, similar 6h, trending 30m) |
| Cache invalidation | `EventEmitter2` (event-driven, real-time) |

---

## 1. Nền tảng: Vector Embeddings

**Ý tưởng cốt lõi**: Biến mỗi bộ phim thành một mảng số (vector 384 chiều). Hai bộ phim "giống nhau" sẽ có vector gần nhau trong không gian 384 chiều đó.

```
"Inception" (Sci-Fi, Action, Nolan, DiCaprio)
→ [0.12, -0.34, 0.87, 0.03, ...] (384 số)

"Interstellar" (Sci-Fi, Drama, Nolan)
→ [0.14, -0.31, 0.85, 0.06, ...] (384 số) ← gần với Inception

"Toy Story" (Animation, Comedy, Family)
→ [-0.72, 0.45, -0.12, 0.88, ...] (384 số) ← xa với Inception
```

Khoảng cách giữa hai vector được đo bằng **cosine similarity**:

```
similarity(A, B) = 1 - cosine_distance(A, B)
                 = 1 - (A <=> B)   -- pgvector syntax
```

Giá trị nằm trong `[0, 1]` — càng gần 1 càng tương tự.

---

## 2. Mô hình AI: `all-MiniLM-L6-v2`

**File**: `api/src/recommendations/embedding.service.ts`

```
Phim → Text representation → Model AI → Vector (384 số)
```

### 2.1 Tạo text từ metadata phim

```typescript
generateMovieText(movie): string
```

Kết hợp các trường metadata thành một đoạn text ngắn gọn:

```
"Title: Inception. Genres: Sci-Fi, Action, Thriller.
 Director: Christopher Nolan. Cast: Leonardo DiCaprio, Joseph Gordon-Levitt.
 Description: A thief who steals corporate secrets through dream-sharing..."
```

Giới hạn description ở 200 ký tự — model được tối ưu cho văn bản ngắn (< 256 tokens).

### 2.2 Inference

```typescript
const output = await this.extractor(text, {
  pooling: 'mean',   // mean pooling: trung bình tất cả token vectors
  normalize: true,   // L2 normalize → vector có độ dài = 1
});
// output.data: Float32Array[384]
```

- **Mean pooling**: lấy trung bình embedding của tất cả tokens → 1 vector đại diện cho toàn bộ câu.
- **L2 normalize**: vector có độ dài = 1, do đó cosine similarity = dot product, tính nhanh hơn.
- **Tốc độ**: ~80ms/text trên CPU; batch processing ~50 phim/lô.

### 2.3 Model loading

Model được load một lần khi NestJS khởi động (`OnModuleInit`). Lần đầu tải ~80MB từ HuggingFace Hub, lưu vào cache disk (`~/.cache/huggingface/`). Các lần sau chỉ mất ~2-3s để khởi tạo ONNX Runtime.

Nếu load thất bại, `loadFailed = true` và hệ thống dùng fallback. `retryLoad()` được gọi tự động ở request tiếp theo.

---

## 3. Lưu trữ: PostgreSQL + pgvector

### 3.1 Schema

```sql
CREATE TABLE movie_embeddings (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  movie_id     TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  embedding    vector(384) NOT NULL,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(movie_id)
);
```

### 3.2 HNSW Index

```sql
CREATE INDEX idx_movie_embeddings_hnsw
  ON movie_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**HNSW** (Hierarchical Navigable Small World): cấu trúc đồ thị nhiều tầng.

- Thay vì so sánh tuần tự với toàn bộ catalog, HNSW đi qua ~log(N) nodes.
- Top-K query trên 10.000 vectors: **~5ms**.
- `m = 16`: mỗi node kết nối tối đa 16 láng giềng.
- `ef_construction = 64`: độ chính xác khi xây dựng index (trade-off với build time).

### 3.3 Similarity query

```sql
-- Tìm phim tương tự với "Inception"
SELECT
  m.id, m.title, m.slug,
  1 - (me.embedding <=> target.embedding) AS similarity
FROM movie_embeddings me
JOIN movies m ON m.id = me.movie_id
CROSS JOIN (
  SELECT embedding FROM movie_embeddings WHERE movie_id = $1
) target
WHERE me.movie_id != $1
ORDER BY me.embedding <=> target.embedding  -- ASC = gần nhất trước
LIMIT 10;
```

---

## 4. User Profile Vector

### 4.1 Ý tưởng

Hành vi của user cũng được biểu diễn bằng một vector — **trung bình có trọng số** của embedding các phim user đã tương tác:

```
user_vector = Σ(weight_i × movie_embedding_i) / Σ|weight_i|
```

Kết quả: `user_vector` phản ánh "gu" của user trong không gian 384 chiều — gần với các phim user thích, xa với phim user không thích.

### 4.2 Trọng số tương tác

| Hành vi | Trọng số cơ bản |
|---|---|
| Xem hết phim (`is_finished = true`) | +3.0 |
| Xem dở (`is_finished = false`) | +1.0 |
| Thêm vào Watchlist | +2.0 |
| Review rating ≥ 4 | +2.5 |
| Review rating 3 | +0.5 |
| Review rating ≤ 2 | **-2.0** (negative signal) |

**Recency boost** — tương tác gần đây được ưu tiên hơn:

```
recency_boost = 1.0 / (1.0 + days_since_interaction / 30)
final_weight  = base_weight × recency_boost
```

Ví dụ: Tương tác 30 ngày trước → boost = 0.5 (giảm một nửa).

### 4.3 Implementation

**File**: `api/src/recommendations/recommendations.repository.ts` — `getUserInteractions()`

```sql
WITH interactions AS (
  -- Watch history
  SELECT wh.movie_id,
    CASE WHEN wh.is_finished THEN 3.0 ELSE 1.0 END
      * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - wh.last_watched_at)) / 86400 / 30)) AS weight
  FROM watch_history wh WHERE wh.user_id = $1

  UNION ALL

  -- Watchlist
  SELECT wl.movie_id,
    2.0 * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - wl.created_at)) / 86400 / 30))
  FROM watchlist wl WHERE wl.user_id = $1

  UNION ALL

  -- Reviews (positive & negative)
  SELECT r.movie_id,
    CASE WHEN r.rating >= 4 THEN 2.5 WHEN r.rating <= 2 THEN -2.0 ELSE 0.5 END
      * (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 / 30))
  FROM reviews r WHERE r.user_id = $1
),
aggregated AS (
  SELECT movie_id, SUM(weight) AS total_weight
  FROM interactions GROUP BY movie_id HAVING SUM(weight) > 0
)
SELECT a.movie_id, a.total_weight AS weight, me.embedding::text
FROM aggregated a
JOIN movie_embeddings me ON me.movie_id = a.movie_id
```

**File**: `api/src/recommendations/recommendations.service.ts` — `buildUserProfile()`

```typescript
const dims = interactions[0].embedding.length;  // 384
const profileVector = new Array<number>(dims).fill(0);
let totalWeight = 0;

for (const { weight, embedding } of interactions) {
  totalWeight += Math.abs(weight);
  for (let i = 0; i < dims; i++) {
    profileVector[i] += weight * embedding[i];
  }
}

const normalized = profileVector.map((v) => v / totalWeight);
// Cache in Redis: profile:{userId}, TTL = 1 hour
```

---

## 5. Các loại Recommendation

### 5a. "For You" — Personalized

**Endpoint**: `GET /recommendations/for-you` (JWT required)
**Cache key**: `rec:foryou:{userId}`, TTL: 1 giờ

```
1. buildUserProfile(userId) → user_vector [384 dims]
2. pgvector: ORDER BY movie_embedding <=> user_vector → top 14 phim (70%)
3. Collaborative filtering → top 6 phim (30%)
4. applyDiversity() → max 3 phim/genre trong top 10
5. Cache và trả về
```

**Collaborative filtering** (30%):
- Tìm users có watch history overlap lớn nhất với user hiện tại.
- Lấy phim phổ biến trong nhóm đó mà user chưa xem.
- Score = (số similar-users đã xem) / (tổng similar-users).

**Genre diversity**:
```typescript
// Trong top 10 kết quả, không để một genre chiếm quá 3 slot
const MAX_PER_GENRE = 3;
```

### 5b. "Because You Watched X"

**Endpoint**: `GET /recommendations/because-you-watched/:movieId` (JWT required)
**Cache key**: `rec:byw:{userId}:{movieId}`, TTL: 2 giờ

```
1. Lấy embedding của phim nguồn
2. ORDER BY cosine distance → top phim tương tự
3. Loại trừ phim user đã xem
4. Gắn reason: "Because you watched {sourceTitle}"
```

### 5c. "Similar Movies"

**Endpoint**: `GET /recommendations/similar/:movieId` (public, no auth)
**Cache key**: `rec:similar:{movieId}`, TTL: 6 giờ

Content-based pure — so sánh embedding phim nguồn với toàn catalog. Được dùng ở trang chi tiết phim.

### 5d. "Trending For You"

**Endpoint**: `GET /recommendations/trending-for-you` (JWT required)
**Cache key**: `rec:trending:{userId}`, TTL: 30 phút

```
1. Trending movies = phim có watch_count cao nhất trong 7 ngày qua
2. Lọc qua user_vector: phim trending nào gần gu user nhất → lên đầu
3. Kết hợp popularity + personalization
```

---

## 6. Cache Invalidation (Event-Driven)

Mỗi khi user tương tác với nội dung, cache recommendation được xoá để rebuild ở request tiếp theo.

```
User xem phim / thêm watchlist / viết review
         ↓
Service emit EventEmitter2 event
         ↓
RecommendationCacheListener.@OnEvent(...)
         ↓
invalidateUserProfile(userId):
  Redis DEL profile:{userId}
  Redis DEL rec:foryou:{userId}
  Redis DEL rec:trending:{userId}
```

| Event class | Trigger |
|---|---|
| `WatchHistorySavedEvent` | `WatchHistoryService.saveProgress()` |
| `WatchlistChangedEvent` | `WatchlistService.addToWatchlist()` / `removeFromWatchlist()` |
| `ReviewCreatedEvent` | `MoviesService.addReview()` |

---

## 7. Auto-Embedding mới phim

### Real-time (event-driven)

**File**: `api/src/recommendations/recommendation-sync.listener.ts`

| Event | Action |
|---|---|
| `MovieCreatedEvent` | `embeddingService.embedMovie(movieId)` (~100ms) |
| `MovieUpdatedEvent` | Re-embed nếu title/genre/cast thay đổi |
| `MovieDeletedEvent` | `embeddingService.deleteEmbedding(movieId)` |
| `MoviesBulkCreatedEvent` | Embed từng phim tuần tự |

### Scheduled (cron jobs)

**File**: `api/src/recommendations/recommendations.cron.ts`

| Schedule | Task |
|---|---|
| `0 */6 * * *` (mỗi 6 giờ) | `embedAllMovies()` — embed phim chưa có vector |
| `0 3 * * *` (3 AM hàng ngày) | Pre-warm Redis cache cho top 100 active users |

---

## 8. Graceful Degradation

Nếu embedding model chưa load xong hoặc lỗi, hệ thống fallback hoàn toàn thay vì crash:

| Endpoint | Fallback |
|---|---|
| `getForYou()` | Trending movies (watch_count 7 ngày) |
| `getBecauseYouWatched()` | Phim cùng genre, sort by rating |
| `getSimilarMovies()` | Phim cùng genre, sort by rating |
| `getTrendingForYou()` | Global trending (không personalize) |

**Model auto-retry**: Khi model load thất bại (`loadFailed = true`), `retryLoad()` được gọi ở mỗi request tiếp theo — model sẽ thử reload lại mà không cần restart server.

---

## 9. Luồng hoàn chỉnh: Homepage load

```
Browser → GET /recommendations/for-you
               ↓
    Redis: rec:foryou:{userId}
          ├─ HIT → return JSON (< 1ms)
          └─ MISS ↓
    EmbeddingService.isReady?
          ├─ NO → retryLoad() → fallbackTrending() → return
          └─ YES ↓
    buildUserProfile(userId)
          ├─ Redis HIT → return cached vector
          └─ MISS: SQL query (watch_history + watchlist + reviews)
                   → weighted average → 384-dim vector
                   → Redis SET profile:{userId} TTL=3600
               ↓
    pgvector: SELECT ... ORDER BY embedding <=> user_vector LIMIT 14
                              (HNSW index → ~5ms)
               ↓
    findUsersWithSimilarTaste() → findPopularAmongSimilarUsers()
                              (6 collaborative results)
               ↓
    applyDiversity([14 content + 6 collab], limit=20)
               ↓
    Redis SET rec:foryou:{userId} TTL=3600
               ↓
    Return 20 × MovieRecommendation[]
```

**Thời gian ước tính**:
- Cache hit: < 1ms
- Cold path (lần đầu): 50–150ms (profile build + HNSW query + collab query)

---

## 10. File Structure

```
api/src/recommendations/
├── recommendations.module.ts          # DI module
├── recommendations.controller.ts      # 4 REST endpoints
├── recommendations.service.ts         # Core algorithms
├── recommendations.repository.ts      # pgvector + SQL queries
├── recommendations.cron.ts            # Scheduled jobs
├── recommendations.service.spec.ts    # 20 unit tests
├── embedding.service.ts               # Transformers.js local inference
├── embedding.service.spec.ts          # 9 unit tests
├── recommendation-sync.listener.ts    # Auto-embed on movie events
├── recommendation-cache.listener.ts   # Cache invalidation on user events
├── interfaces/
│   └── recommendation.interfaces.ts  # MovieRecommendation, UserProfile, ...
└── dto/
    └── recommendation-query.dto.ts    # limit validation

api/scripts/
└── seed-embeddings.ts                 # One-time script to embed all movies

api/prisma/migrations/
├── 20260326000000_enable_pgvector/    # CREATE EXTENSION IF NOT EXISTS vector
└── 20260326000001_add_movie_embeddings/ # movie_embeddings table + HNSW index

web/src/
├── services/recommendation.service.ts # Frontend API client
└── components/movie/RecommendationRow.tsx # UI component (auth-gated, skeleton)
```

---

## 11. Chi phí

| Item | Chi phí |
|---|---|
| Embedding model (`all-MiniLM-L6-v2`) | **$0** — Apache 2.0, local inference |
| pgvector | **$0** — PostgreSQL extension |
| Compute | **$0** — chạy trên server CPU hiện có |
| API calls | **$0** — không cần external service |
| **Tổng** | **$0/tháng** |

> Nếu muốn nâng cấp chất lượng: swap `EmbeddingService.onModuleInit()` sang `OpenAI text-embedding-3-small` (`$0.02/1M tokens`) — toàn bộ pipeline (pgvector, caching, algorithms) giữ nguyên, không cần thay đổi gì khác.
