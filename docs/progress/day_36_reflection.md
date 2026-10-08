# Day 36 - Soft Delete

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Delete without losing data: move articles to a **trash** they can be restored from, while the rest of the app behaves as if they were gone.

## Key Learnings
- Soft delete = `deletedAt` timestamp instead of removing the row
- A Prisma client extension applies it everywhere: reads add `deletedAt: null`, `delete` becomes "set deletedAt" — nobody has to remember
- The unfiltered client is an explicit escape hatch, used only by the trash (list, restore, purge)
- Uniqueness must ignore deleted rows: a **partial unique index** (`WHERE "deletedAt" IS NULL`), added by hand to the migration because Prisma's schema can't express it
- Restoring can conflict if the slug was reused meanwhile — the index turns that into a 409 automatically
- Permanent deletion (purge) only from the trash

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** (client extensions) + **PostgreSQL** (partial index)
- **Jest** + **Supertest**

## Project Structure (Day 36)
```
src/lib/soft-delete.ts            ← onlyActive() helper
src/lib/prisma.ts                 ← extension + unfiltered client
src/controllers/article.controller.ts  ← written as if soft delete didn't exist
src/controllers/trash.controller.ts    ← the only place that sees deleted rows
prisma/migrations/…/migration.sql      ← hand-added partial unique index
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | Active articles |
| POST | `/api/articles` | Create (slug unique among active) |
| DELETE | `/api/articles/:id` | Move to trash |
| GET | `/api/articles/trash` | Deleted articles |
| POST | `/api/articles/:id/restore` | Restore (409 if slug taken) |
| DELETE | `/api/articles/:id/permanent` | Purge from the trash |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_36_soft_delete_pattern
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- `prisma migrate dev` doesn't know about the partial index; a future generated migration may try to drop it, so the migration SQL documents that
- `/articles/trash` had to be registered before `/articles/:slug`, otherwise "trash" is read as a slug

### Next Steps
- Day 39: file uploads to object storage
