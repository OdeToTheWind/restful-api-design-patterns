# Day 48 - Relational Data Modeling & Exposing the N+1 Query Problem

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Model complex **one-to-many and many-to-many relationships** with Prisma and PostgreSQL, execute atomic nested writes, handle foreign key violations gracefully, and build an operation-counting extension that explicitly exposes and solves the **N+1 query problem**.

## Key Learnings
- **Relationship Archetypes in Prisma**:
  - **One-to-Many**: `Course` → `Lessons` configured with `onDelete: Cascade`, ensuring removing a course cleans up its associated lessons.
  - **Explicit Many-to-Many Join Model**: `Enrollment` connecting `Student` and `Course` with metadata (`enrolledAt`) and a composite primary key `@@id([studentId, courseId])`.
  - **Implicit Many-to-Many**: `Course` ↔ `Tag` where Prisma automatically manages the join table without extra schema overhead.
- **Atomic Nested Writes**: Creating a course, inserting nested lessons, and utilizing `connectOrCreate` for tags within a single `prisma.course.create` invocation guarantees that the entire graph commits together in one transaction.
- **Uncovering the N+1 Query Problem**: Naive ORM queries often loop over results and issue child queries for each parent record. To make this performance penalty visible, I authored an operation counter extension using `AsyncLocalStorage` that tracks query counts per request and returns an `X-Prisma-Operations` header:
  - **Naive Endpoint (`/api/courses/naive`)**: Executes `1 + 3N` database operations (1 query for courses, plus separate queries for tags, lesson count, and student count per course). With 10 courses, that's 31 database round-trips!
  - **Optimized Endpoint (`/api/courses`)**: Uses Prisma's `select`, `include`, and `_count` to fetch the identical response in **exactly 1 operation**.
- **Accurate Foreign Key Error Mapping**: Foreign key constraint violations (Prisma error `P2003`, such as enrolling a non-existent student ID) map to `422 Unprocessable Entity` rather than generic 500 errors.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** (relations, client extensions) + **PostgreSQL**
- **Jest** + **Supertest**

## Project Structure (Day 48)
```bash
day_48_relationships_prisma/
├── prisma/
│   └── schema.prisma            # Course, Lesson, Student, Enrollment, and Tag models
├── src/
│   ├── lib/
│   │   └── operation-counter.ts # Prisma client extension tracking queries via AsyncLocalStorage
│   ├── controllers/
│   │   └── course.controller.ts # Compares naive (1+3N) vs optimized (1 query) implementations
│   ├── routes/
│   │   └── course.routes.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | DB Operations |
|--------|----------|-------------|---------------|
| GET | `/api/courses` | Optimized course catalog listing | Exactly 1 query |
| GET | `/api/courses/naive` | Naive N+1 implementation | 1 + 3N queries |
| POST | `/api/courses` | Atomic nested creation of course, lessons, and tags | 1 transaction |
| GET | `/api/courses/:id` | Single course with ordered lesson curriculum | 1 query |
| POST | `/api/courses/:id/enrollments` | Enrolls student (409 on duplicate, 422 if student missing) | 1 query |
| GET | `/api/students/:id/courses` | Retrieves enrolled courses via join model | 1 query |
| DELETE | `/api/courses/:id` | Deletes course and cascades to lessons | 1 query |

## Operation Counter Extension

```typescript
// src/lib/operation-counter.ts
import { AsyncLocalStorage } from 'node:async_hooks';

const counterStorage = new AsyncLocalStorage<{ count: number }>();

export const extendedPrisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ query, args }) {
        const store = counterStorage.getStore();
        if (store) store.count += 1;
        return query(args);
      },
    },
  },
});
```

## How to Run & Verify

```bash
cd demos/intermediate/day_48_relationships_prisma
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Run tests asserting operation count headers (1 vs 1+3N)
pnpm test
```

### Challenges Faced & Solved
- **Operation Math Discrepancy**: I initially estimated the naive endpoint's query cost as `1 + 2N`. When the test failed, inspecting the query logs revealed `1 + 3N`: fetching tags, calculating lesson counts, and calculating enrollment counts were executing three distinct queries per course item. The operation counter made this hidden performance cost instantly visible.
- **Handling Unlinked Relations**: Enrolling a non-existent student was initially triggering an unhandled Prisma foreign key error that returned 500. Adding Prisma code `P2003` to `@restful/shared`'s error handler correctly mapped it to `422 Unprocessable Entity`.

### Next Steps
- Implement environment-driven configuration management with layered `.env` files and production validation in Day 49.

---

**Status: ✅ Day 48 Successfully Completed**  
**Progress: 48/100 Days**  
**Milestone: Relational modeling mastered in Prisma with cascade deletes, composite join keys, and transparent N+1 query elimination.**
