# Day 32 - Advanced Pagination, Filtering and Sorting

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Build a production-grade Products catalog API implementing **dual pagination strategies** (traditional offset-based pagination and high-performance keyset/cursor-based pagination), dynamic multi-field filtering, and strict whitelisted sorting to prevent performance bottlenecks and query injection.

## Key Learnings
- **Trade-offs of Offset Pagination**: Offset pagination (`page` and `pageSize`) is straightforward and provides total page numbers for classic UI tables. However, on large tables, PostgreSQL still must scan and skip `OFFSET` rows, degrading performance. Furthermore, if records are inserted or deleted while a user navigates, items slide across page boundaries.
- **Keyset (Cursor) Pagination Stability**: Using a composite cursor based on `(createdAt, id)` guarantees `O(1)` query speed regardless of dataset depth and maintains a stable feed without missing or duplicating records as new items arrive.
- **The `limit + 1` Query Pattern**: By fetching `limit + 1` rows, I can check whether a subsequent page exists without issuing an expensive `COUNT(*)` query across the table.
- **Sort Key Whitelisting**: Never pass arbitrary client strings directly into an ORM's `orderBy` clause. Mapping allowed sort keys (`price`, `-price`, `createdAt`, etc.) to explicit Prisma direction objects protects against unexpected query paths.
- **Tie-breaker Sorting**: Every sort clause must terminate with a unique column (such as `id`) to ensure deterministic database ordering across page chunks.
- **Strict Query String Validation**: Leveraging Zod's `z.coerce` transforms string query parameters into typed integers and dates while stripping or rejecting unexpected keys.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Zod** + `@restful/shared` pagination utilities
- **Jest** + **Supertest**

## Project Structure (Day 32)
```bash
day_32_advanced_pagination_filter_sort/
├── src/
│   ├── validators/
│   │   └── product.schema.ts      # Query schemas, cursor validation, sort whitelists
│   ├── controllers/
│   │   └── product.controller.ts  # buildWhere, buildOrderBy, keyset encoding
│   ├── docs/
│   │   └── openapi.ts             # OpenAPI 3.1 documentation for query parameters
│   ├── routes/
│   │   └── product.routes.ts
│   ├── app.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma              # Product model with compound indexes
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/products` | Offset pagination with category filters, price bounds, and sorting | 200 |
| GET | `/api/products/feed` | Keyset cursor pagination for infinite scroll feeds | 200 / 400 |
| POST | `/api/products` | Create a new catalog item | 201 |
| GET | `/api/docs` | Swagger UI documenting query parameters and response envelopes | 200 |

## Offset vs. Cursor Query Implementation

```typescript
// Cursor generation and keyset decoding
const decodeCursor = (cursor: string): { createdAt: Date; id: string } => {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const [isoDate, id] = raw.split('|');
    const createdAt = new Date(isoDate);
    if (isNaN(createdAt.getTime()) || !id) {
      throw new AppError('Invalid cursor structure', 400);
    }
    return { createdAt, id };
  } catch {
    throw new AppError('Invalid cursor format', 400);
  }
};
```

## How to Run & Verify

```bash
cd demos/intermediate/day_32_advanced_pagination_filter_sort
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Execute pagination and filter test suite
pnpm test
```

### Challenges Faced & Solved
- **Malformed Cursor Crash**: Initially, if a client passed an unparseable cursor or corrupted Base64 string, the invalid date was forwarded to Prisma, resulting in a database error and a 500 response. I wrapped cursor decoding in explicit validation that raises an `AppError('Invalid cursor', 400)`, gracefully rejecting corrupt client inputs.
- **Floating Point Currency Inaccuracy**: Storing prices as floating-point numbers risks rounding errors in financial filtering. I represented all currency values as integer cents (`priceInCents`), preserving precision.
- **Strict Separation of Modes**: Adding `.strict()` to the feed query schema ensures that clients mistakenly sending `?page=2` to `/api/products/feed` receive a 400 error rather than a confusing silently-ignored response.

### Next Steps
- Integrate Redis caching in Day 33 using the cache-aside pattern to accelerate frequent catalog reads and implement cache invalidation strategies.

---

**Status: ✅ Day 32 Successfully Completed**  
**Progress: 32/100 Days**  
**Milestone: Enterprise-grade pagination architectures implemented with both offset and keyset/cursor strategies.**
