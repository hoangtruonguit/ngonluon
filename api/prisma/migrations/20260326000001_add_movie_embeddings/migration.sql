CREATE TABLE movie_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
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
