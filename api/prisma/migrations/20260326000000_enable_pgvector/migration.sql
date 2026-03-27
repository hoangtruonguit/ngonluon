-- Enable pgvector extension for vector similarity search
-- Requires: pgvector/pgvector:pg15 Docker image (see docker-compose.yml)
CREATE EXTENSION IF NOT EXISTS vector;
