# Day 35 - Seeding and Migrations

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Give every developer, test run and CI job the **same database**: deterministic, idempotent seed data that runs with `prisma db seed` and on every `migrate reset`.

## Key Learnings
- Seeds should be plain deterministic data — no `Math.random()`, no `Date.now()`
- Idempotency through upserts on natural keys (author email, post slug): running the seed twice changes nothing
- Profiles (`minimal`, `demo`) for different needs, chosen with `SEED_PROFILE`
- Keeping the logic in `src/seed` makes it type-checked and unit-testable; `prisma/seed.ts` is only an entry point
- A snapshot test makes any change to the seed data a deliberate, reviewed change
- `prisma migrate reset` = drop, re-apply all migrations, run the seed — a clean slate in one command

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- **Jest** (snapshot tests)

## Project Structure (Day 35)
```
prisma/
├── schema.prisma     ← Author, Post (slug is the natural key)
└── seed.ts           ← entry point for `prisma db seed`
src/seed/
├── data.ts           ← deterministic seed data per profile
└── seed.ts           ← idempotent upserts in one transaction
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Published posts, newest first |
| GET | `/api/posts/:slug` | One published post (drafts → 404) |
| GET | `/api/authors` | Authors with published post counts |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_35_seeding_migrations
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm seed                         # idempotent — run it as often as you like
pnpm db:reset                     # drop + migrate + seed
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- Drafts are seeded too, so the API must filter on `published: true` everywhere — the smoke test checks that a draft slug returns 404
- Snapshots aren't written in CI (`--ci`), so the snapshot has to be generated locally and committed

### Next Steps
- Day 37: separate business rules from storage with a service + repository layer
