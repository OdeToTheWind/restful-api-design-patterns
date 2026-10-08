# Day 48 - Database Relationships

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Model **one-to-many** and **many-to-many** relationships with Prisma, write nested data in one call, and make the **N+1 problem** visible.

## Key Learnings
- One-to-many: Course → Lessons, with `onDelete: Cascade`
- Many-to-many with data on the link (enrollment date): an explicit join model with a composite key
- Many-to-many without data: an implicit relation (Course ↔ Tag)
- Nested writes: course + lessons + `connectOrCreate` tags in one call (one transaction)
- N+1: a Prisma client extension counts operations per request (`X-Prisma-Operations`): the naive list needs 1 + 3N, the `select`/`_count` version 1
- Foreign key violations (P2003) map to 422 in `@restful/shared`

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** (relations, extensions) + **PostgreSQL**
- **Jest** + **Supertest**

## Project Structure (Day 48)
```
prisma/schema.prisma            ← Course, Lesson, Student, Enrollment, Tag
src/lib/operation-counter.ts    ← per-request operation count (AsyncLocalStorage)
src/controllers/course.controller.ts ← proper vs naive list
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List: 1 operation |
| GET | `/api/courses/naive` | Same data: 1 + 3N operations |
| POST | `/api/courses` | Nested write |
| GET | `/api/courses/:id` | With ordered lessons |
| POST | `/api/courses/:id/enrollments` | Enroll (409 twice, 422 unknown student) |
| GET | `/api/students/:id/courses` | Through the join model |
| DELETE | `/api/courses/:id` | Cascades |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_48_relationships_prisma
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- I first wrote the naive cost as 1 + 2N; it's 1 + 3N (tags, lesson count and enrollment count per course) — the counter made the mistake obvious
- Enrolling a non-existent student was a 500 until P2003 got its own mapping

### Next Steps
- Day 50: transactions
