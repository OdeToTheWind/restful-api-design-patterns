# Day 36 - Soft Delete Pattern with Prisma Extensions & Partial Indexes

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Implement a dependable **soft-delete system** for articles. Deleting a record must preserve audit history and allow restoration from a trash bin, standard application queries must automatically ignore deleted rows without developer intervention, and slugs must remain reusable once an older article is soft-deleted.

## Key Learnings
- **Soft Deletion with `deletedAt` Timestamps**: Rather than issuing destructive SQL `DELETE` statements, records are marked with a nullable `deletedAt` timestamp. Null indicates an active entity; a timestamp records when it was moved to the trash.
- **Automated Filtering via Prisma Client Extensions**: Implementing Prisma client extensions (`$extends`) guarantees that standard database operations (`findMany`, `findFirst`, `findUnique`) automatically filter for `deletedAt: null`, and standard `delete` calls are transparently converted to `update({ data: { deletedAt: new Date() } })`. Developers cannot accidentally expose soft-deleted records.
- **Explicit Unfiltered Client**: Creating an isolated `unfilteredPrisma` client instance provides an intentional escape hatch used exclusively by administrative trash controllers (`listTrash`, `restore`, `permanentPurge`).
- **PostgreSQL Partial Unique Indexes**: In standard database schemas, a `UNIQUE (slug)` constraint prevents creating a new article with a slug previously used by a deleted article. To fix this, I hand-added a PostgreSQL partial unique index (`CREATE UNIQUE INDEX articles_slug_active_idx ON "Article"("slug") WHERE "deletedAt" IS NULL;`). This allows slug reuse for active items while preventing duplicates among active records.
- **Slug Collisions on Restoration**: If an article in the trash is restored after a new active article has taken its slug, the partial unique index prevents the update and immediately throws a unique constraint violation, cleanly mapped to a `409 Conflict`.
- **Express Route Parameter Precedence**: Registering specific static routes like `/api/articles/trash` strictly before parameterized routes like `/api/articles/:slug` prevents Express from interpreting the path segment `'trash'` as a dynamic slug parameter.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** (client extensions) + **PostgreSQL** (partial unique index)
- **Jest** + **Supertest**

## Project Structure (Day 36)
```bash
day_36_soft_delete_pattern/
├── prisma/
│   ├── schema.prisma                  # Article model with deletedAt field
│   └── migrations/
│       └── 20261008000000_add_soft_delete_and_partial_index/
│           └── migration.sql          # Hand-crafted partial unique index
├── src/
│   ├── lib/
│   │   ├── prisma.ts                  # Extended Prisma client with soft-delete hooks
│   │   └── soft-delete.ts             # onlyActive() query helpers
│   ├── controllers/
│   │   ├── article.controller.ts      # Standard business handlers (soft-delete unaware)
│   │   └── trash.controller.ts        # Dedicated trash management handlers
│   ├── routes/
│   │   └── article.routes.ts          # Route definitions with careful order
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/articles` | List active, non-deleted articles | 200 |
| POST | `/api/articles` | Create article (slug must be unique among active items) | 201 / 409 |
| GET | `/api/articles/:slug` | Retrieve single active article by slug | 200 / 404 |
| DELETE | `/api/articles/:id` | Move article to trash (sets `deletedAt`) | 204 / 404 |
| GET | `/api/articles/trash` | View soft-deleted articles in trash | 200 |
| POST | `/api/articles/:id/restore` | Restore article from trash (fails if slug reused) | 200 / 409 |
| DELETE | `/api/articles/:id/permanent`| Permanently purge article from database | 204 / 404 |

## Partial Index Migration & Extended Client

```sql
-- prisma/migrations/.../migration.sql
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Hand-added partial unique index:
CREATE UNIQUE INDEX "Article_slug_active_key" ON "Article"("slug") WHERE "deletedAt" IS NULL;
```

```typescript
// src/lib/prisma.ts
export const extendedPrisma = prismaClient.$extends({
  query: {
    article: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async delete({ args }) {
        return (prismaClient.article.update as any)({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});
```

## How to Run & Verify

```bash
cd demos/intermediate/day_36_soft_delete_pattern
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Run comprehensive soft-delete lifecycle tests
pnpm test
```

### Challenges Faced & Solved
- **Prisma Schema Limitations with Partial Indexes**: Prisma's native `schema.prisma` syntax does not support SQL `WHERE` clauses inside `@@unique` definitions. Running `prisma migrate dev --create-only` allowed me to inspect and customize the raw SQL migration file to append the partial index before executing the migration.
- **Route Precedence Trap**: Initially, invoking `GET /api/articles/trash` triggered the `getArticleBySlug` controller, which searched for an article with slug `"trash"` and returned 404. Placing the trash router before `/:slug` resolved the routing conflict immediately.

### Next Steps
- Implement the Repository and Service Layer architectural patterns in Day 37 to isolate business workflows from database persistence and framework mechanics.

---

**Status: ✅ Day 36 Successfully Completed**  
**Progress: 36/100 Days**  
**Milestone: Soft-delete architecture implemented with Prisma client extensions, PostgreSQL partial unique indexing, and conflict-safe restoration.**
