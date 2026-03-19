# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NgonLuon is a full-stack movie streaming platform. The repo contains two independent applications:
- `api/` — NestJS 11 backend (pnpm, port 3001)
- `web/` — Next.js 16 frontend with App Router (npm, port 3000)

## Commands

### API (run from `api/`)

```bash
pnpm install
pnpm run start:dev        # Development with watch mode
pnpm run build            # Production build
pnpm run lint             # ESLint with auto-fix
pnpm run test             # Jest unit tests
pnpm run test:watch       # Watch mode
pnpm run test:cov         # Coverage report
pnpm run test:e2e         # End-to-end tests
pnpm run seed:tmdb        # Seed movies from TMDB API

npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma migrate dev    # Create and apply new migration
npx prisma migrate deploy # Apply migrations (production)
```

### Web (run from `web/`)

```bash
npm install --legacy-peer-deps   # Required due to peer dependency conflicts
npm run dev                      # Development server
npm run build                    # Production build
npm run lint                     # ESLint check
```

### Infrastructure

```bash
docker-compose up -d    # Start all services (run from repo root)
```

Services: PostgreSQL 15 (5432), Redis (6379), Elasticsearch 7.17 (9200), Kibana (5601), RabbitMQ (5672, admin 15672), Mailcatcher (SMTP 1025, UI 1080).

## Architecture

### Backend — NestJS

Feature-based module structure under `api/src/`:
- `auth/` — JWT authentication with asymmetric RS256 signing, refresh token strategy
- `movies/` — Movie/series CRUD, comments (with spoiler flag), reviews
- `search/` — Elasticsearch full-text search integration
- `watch-history/`, `watchlist/` — User progress and favorites
- `mail/` — Nodemailer email service (templates + queue-based sending)
- `rabbitmq/` — RabbitMQ integration for async jobs (mail, indexing)
- `redis/` — ioredis caching service
- `elasticsearch/` — Search indexing, sync service, and `MovieSyncListener` (EventEmitter-based)
- `tmdb/` — TMDB API client for data seeding; CLI commands in `tmdb/commands/`
- `common/` — Shared guards, filters, interceptors, decorators, events, logger (Winston)
- `prisma/` — Database service wrapping PrismaClient

Database entities (PostgreSQL via Prisma): `User` (roles: ADMIN, USER, VIP), `Movie`/`Series`, `Season`, `Episode`, `Cast`, `Review`, `Comment`, `WatchHistory`, `Watchlist`, `Subscription`, `Genre`.

Swagger/OpenAPI docs: `http://localhost:3001/api`

### Frontend — Next.js

App Router with locale-based routing under `web/src/app/[locale]/`:
- `(auth)/` — Login, register
- `(main)/` — Home, `movies/[slug]`, `watch/[slug]`, `genre/[slug]`, `category/[slug]`, `search/`, `profile/`

Key patterns:
- Server components by default; use client components only when necessary
- `src/services/` — API service classes (e.g., `movie.service.ts`, `search.service.ts`)
- `src/lib/api.ts` — Axios-based API client
- `src/i18n/` — next-intl configuration; translations in `src/messages/`
- Path alias: `@/*` → `./src/*`
- Images: configured for `image.tmdb.org`, Unsplash, DiceBear in `next.config.ts`

## Environment Variables

**API** (`api/.env`, see `api/.env.example`):
```
DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, TMDB_API_KEY,
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS,
ELASTICSEARCH_URL, REDIS_HOST, REDIS_PORT, RABBITMQ_URL,
NODE_ENV, PORT (default: 3001)
```

**Web** (`web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## CI/CD

GitHub Actions at `.github/workflows/ci.yml` runs on push/PR to `main`:
- **api-unit**: Install → Prisma generate → Lint → Build → Unit Test with Coverage
- **api-e2e**: (needs api-unit) Install → Prisma generate → Migrate → E2E Test (with PostgreSQL, Elasticsearch, Redis, RabbitMQ services). RabbitMQ is mocked in E2E tests to avoid queue race conditions.
- **web**: Install (`--legacy-peer-deps`) → Lint → Build

## Testing

- **Unit tests** use NestJS `Test.createTestingModule` with mocked dependencies (Prisma, Redis, etc.)
- **E2E tests** override `RabbitMQService` and `AMQP_CONNECTION_MANAGER` with stubs — real RabbitMQ has race conditions between `setupTopology` and consumer `addSetup`
- Use `NestJS Logger` (not `console.*`) across all services for consistent logging
- Run `pnpm run test` from `api/` before pushing
