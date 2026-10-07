# Day 45 - Integration Testing with Testcontainers

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Test what mocks can't: run the app against a **real PostgreSQL** started by Testcontainers, with the real migrations, through the full HTTP stack.

## Key Learnings
- Two suites: fast unit tests (`pnpm test`, no Docker) and integration tests (`pnpm test:integration`, real database)
- `globalSetup` starts a disposable Postgres container, applies `prisma migrate deploy`, and exposes `DATABASE_URL` to the workers
- Real behaviour verified: Postgres array semantics (`hasEvery`), the unique constraint → 409, real `P2025` → 404, the GIN index exists
- Truncating tables between tests keeps them independent; one worker because they share a database
- Testcontainers' Ryuk container removes leftovers even if a run crashes

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL** (arrays, GIN index)
- **@testcontainers/postgresql**
- **Jest** + **Supertest**

## Project Structure (Day 45)
```
src/
├── __tests__/bookmarks.test.ts          ← unit (mocked)
└── __integration__/bookmarks.int.test.ts ← real PostgreSQL
integration.global-setup.js              ← start container + migrate
integration.global-teardown.js
jest.integration.config.js
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks?tag=&tag=` | List; all given tags must match |
| POST | `/api/bookmarks` | Add (tags normalised, de-duplicated) |
| DELETE | `/api/bookmarks/:id` | Delete |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_45_integration_testing_testcontainers
pnpm test               # unit tests, no Docker
pnpm test:integration   # needs Docker
```

### Challenges Faced & Solved
- Testcontainers 12 requires Node ≥ 22.22, while the workspace supports Node 20 — pinned to v11
- The unit test pattern also matched `*.int.test.ts`, so integration tests live in `__integration__/` and the unit config ignores that folder
- The unit suite briefly missed the function-coverage gate because the success paths only ran in the integration suite

### Next Steps
- Day 46: package a demo as a production Docker image
