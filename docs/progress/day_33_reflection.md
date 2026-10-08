# Day 33 - Redis Caching & Cache Invalidation

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Implement high-throughput reading using the **Cache-Aside pattern** with Redis 7, establish dependable write-through cache invalidation (including list versioning), and ensure the API degrades gracefully to database queries if Redis becomes unavailable.

## Key Learnings
- **The Cache-Aside (Lazy Loading) Workflow**: Application logic inspects Redis first. On a cache hit, data returns immediately. On a cache miss, data is read from PostgreSQL, populated into Redis with an explicit Time-To-Live (TTL), and returned to the caller.
- **Write-First Invalidation Order**: Always commit updates to the database *before* evicting Redis cache entries. Inverting this order creates a race condition where a concurrent read can fetch old data from the database and re-populate the cache right before the write completes.
- **Cache Invalidation for Collections via List Versioning**: Evicting individual item keys (`product:123`) is straightforward, but evicting hundreds of paginated, filtered search results is notoriously hard. By maintaining a single `products:version` integer and incorporating it into list cache keys (`products:v{version}:p{page}...`), bumping the version on any mutation renders all prior collection queries unreachable instantaneously without costly scanning.
- **Graceful Degradation with Fail-Fast Configuration**: Setting `enableOfflineQueue: false` and `maxRetriesPerRequest: 1` in `ioredis` prevents incoming requests from hanging when Redis is down. Queries bypass the cache seamlessly and populate the `X-Cache: BYPASS` header.
- **Selective Readiness Checks**: The `/ready` probe checks PostgreSQL connectivity but treats Redis as an optional accelerator. If Redis fails, the API remains available to serve live traffic directly from the primary database.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Redis 7** (running via Docker with LRU memory eviction)
- **ioredis** + **ioredis-mock** (for isolated unit tests)
- **Jest** + **Supertest**

## Project Structure (Day 33)
```bash
day_33_caching_redis_intro/
├── src/
│   ├── lib/
│   │   ├── redis.ts       # Singleton connection with fail-fast options and error logging
│   │   └── cache.ts       # cached(), invalidate(), bumpListVersion() utilities
│   ├── controllers/
│   │   └── product.controller.ts # Handlers with cache-aside and X-Cache headers
│   ├── routes/
│   │   └── product.routes.ts
│   ├── app.ts
│   └── index.ts
├── docker-compose.yml     # PostgreSQL + Redis 7
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Cache Behavior |
|--------|----------|-------------|----------------|
| GET | `/api/products` | Retrieve catalog list | Cache-aside (X-Cache: HIT / MISS / BYPASS) |
| GET | `/api/products/:id` | Retrieve single item by ID | Cache-aside with per-item key |
| POST | `/api/products` | Create product | Bumps list version key |
| PATCH | `/api/products/:id` | Update product | Evicts item key + bumps list version |
| DELETE | `/api/products/:id` | Delete product | Evicts item key + bumps list version |

## Cache Invalidation Pattern

```typescript
// src/lib/cache.ts
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; status: 'HIT' | 'MISS' | 'BYPASS' }> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return { data: JSON.parse(cached), status: 'HIT' };
    }
  } catch (err) {
    logger.warn('Redis unavailable, bypassing cache', { error: err });
    const data = await fetcher();
    return { data, status: 'BYPASS' };
  }

  const data = await fetcher();
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn('Failed to populate Redis cache', { error: err });
  }
  return { data, status: 'MISS' };
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_33_caching_redis_intro
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Test cache hits, misses, and mock fallbacks
pnpm test
```

### Challenges Faced & Solved
- **Shutdown Rejection on Severed Redis Connections**: In our smoke test suite, Redis is stopped mid-execution to verify fallback handling. When the server later tried to shut down gracefully, `redis.quit()` rejected because the socket was closed, causing process termination with an error exit code. I updated the shutdown handler to inspect `redis.status` and call `redis.disconnect()` instead when not in a ready state.
- **Unhandled Error Event Spam**: Without an attached `.on('error', ...)` listener, `ioredis` emits uncaught exception events for every failed reconnect attempt. Adding an explicit error listener converts connection drops into structured warnings.

### Next Steps
- Implement structured contextual logging in Day 34 using Winston and `AsyncLocalStorage` to trace requests and ensure sensitive data never appears in logs.

---

**Status: ✅ Day 33 Successfully Completed**  
**Progress: 33/100 Days**  
**Milestone: Production Redis caching architecture implemented with list versioning and resilient offline degradation.**
