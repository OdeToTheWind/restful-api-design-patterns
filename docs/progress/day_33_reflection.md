# Day 33 - Redis Caching

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Speed up reads with **cache-aside** caching in Redis, keep the cache correct with explicit invalidation, and keep the API working when Redis is down.

## Key Learnings
- Cache-aside: read Redis → on a miss load from the database → store with a TTL
- Invalidate on writes: delete the item key; for lists, bump a **version number** so every old list key becomes unreachable at once
- Write to the database first, then invalidate — otherwise a concurrent read can re-cache the old row
- The TTL is a safety net that bounds staleness if an invalidation is ever missed
- Degrade, don't fail: with `enableOfflineQueue: false` Redis errors are immediate and requests fall back to the database (`X-Cache: BYPASS`)
- Testing with `ioredis-mock` gives real Redis command semantics without a server

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **Redis 7** + **ioredis**
- **ioredis-mock**, **Jest** + **Supertest**

## Project Structure (Day 33)
```
src/
├── lib/redis.ts      ← one connection, fail-fast options
├── lib/cache.ts      ← cached(), invalidate(), list versioning
└── controllers/product.controller.ts
docker-compose.yml    ← Postgres + Redis (no persistence, LRU eviction)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List (cached; `X-Cache` header) |
| GET | `/api/products/:id` | One product (cached per id) |
| POST | `/api/products` | Create (bumps list version) |
| PATCH | `/api/products/:id` | Update (evicts + bumps) |
| DELETE | `/api/products/:id` | Delete (evicts + bumps) |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_33_caching_redis_intro
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- The smoke test stops Redis mid-run: reads correctly switched to `BYPASS`, but **shutdown then exited with code 1** because `redis.quit()` rejects on a dead connection — the hook now disconnects instead when Redis isn't ready
- Without an `error` listener, ioredis reports every reconnect attempt as an unhandled error event
- Readiness (`/ready`) checks only the database on purpose: Redis is optional, so its absence shouldn't take the API out of rotation

### Next Steps
- Day 35: seed data so every environment starts from the same database
