# Day 32 - Advanced Pagination, Filtering and Sorting

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Build a Products catalog that supports filtering, whitelisted sorting and **two pagination strategies** — offset (jump to page N) and cursor/keyset (stable feeds).

## Key Learnings
- Offset pagination: simple and supports page numbers, but deep pages get slower and rows shift when data changes
- Cursor (keyset) pagination on `(createdAt, id)`: stable under inserts and fast at any depth; the cursor is an opaque, encoded position
- Fetching `limit + 1` rows to know whether a next page exists without a COUNT query
- Sorting must be a whitelist (`price`, `-price`, …) mapped to columns — never pass a client string into `orderBy`
- Always add a unique tie-breaker (`id`) to the sort so pages never overlap or skip rows
- Validating query strings with `validateQuery` + `z.coerce`, and indexes that match the filters and sort keys

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **Zod**, `@restful/shared` pagination helpers
- **Jest** + **Supertest**

## Project Structure (Day 32)
```
src/
├── validators/product.schema.ts   ← query schemas, sort whitelist
├── controllers/product.controller.ts ← buildWhere, buildOrderBy, keyset cursor
└── docs/openapi.ts
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products?category=&q=&minPrice=&maxPrice=&sort=&page=&pageSize=` | Offset pagination + filters + sort |
| GET | `/api/products/feed?cursor=&limit=&category=` | Cursor pagination, newest first |
| POST | `/api/products` | Add a product |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_32_advanced_pagination_filter_sort
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- A cursor that decoded fine but wasn't `<date>|<id>` reached Prisma as an invalid date and became a 500 — it now returns 400 `Invalid cursor`
- Money is stored as integer cents to avoid floating-point rounding
- `.strict()` on the feed query turns accidental `?page=` usage into a clear 400 instead of being silently ignored

### Next Steps
- Day 33: cache the hot reads with Redis
