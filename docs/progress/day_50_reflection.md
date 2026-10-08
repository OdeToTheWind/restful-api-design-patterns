# Day 50 - Database Transactions

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Move money **atomically and safely under concurrency**: transactions, isolation levels, idempotency keys and optimistic locking.

## Key Learnings
- Interactive `$transaction`: debit, credit and transfer record commit together or not at all
- The debit is a **conditional update** (`balance >= amount`), so two concurrent transfers can't both spend the same money; a `CHECK` constraint backs it up
- `Serializable` isolation + retrying on serialization failures (P2034) with exponential backoff and jitter
- When contention still wins: `503` + `Retry-After` (retryable), not `500`
- Idempotency keys: the same key replays the original transfer; a different body with the same key is refused (422)
- Optimistic locking for edits: `version` → `ETag`; `If-Match` required (428), stale versions get 412

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL** (Serializable, CHECK constraint)
- **Jest** + **Supertest**

## Project Structure (Day 50)
```
src/services/transfer.service.ts  ← transaction, conditional debit, retry policy
src/routes/index.ts               ← ETag / If-Match / If-None-Match, Idempotency-Key
prisma/migrations/…/migration.sql ← hand-added CHECK (balanceCents >= 0)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts` | Create (returns ETag) |
| GET | `/api/accounts/:id` | Read (ETag, 304) |
| PATCH | `/api/accounts/:id` | Update with If-Match |
| POST | `/api/transfers` | Atomic transfer (`Idempotency-Key`) |
| GET | `/api/transfers?accountId=` | History |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_50_database_transactions
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- **Found by the smoke test:** 20 simultaneous transfers on one account produced more serialization conflicts than 3 retries could absorb; correctness held, but half the requests got 500. More attempts with jittered exponential backoff fixed it (stable over repeated runs: 10 succeed, 10 get 409), and exhausted retries now return 503 + Retry-After
- The conditional debit alone already prevents overdrafts; Serializable is there to show isolation and conflict handling

### Next Steps
- Advanced phase: HATEOAS (Day 51)
