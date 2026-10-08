# Day 50 - Database Transactions, Isolation Levels & Optimistic Concurrency

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Design and implement an **atomic financial ledger API** capable of safely executing concurrent account-to-account fund transfers. The system must utilize interactive database transactions, handle high-concurrency serialization conflicts with jittered exponential retries, enforce HTTP idempotency keys, and protect against lost updates using HTTP `ETag` and `If-Match` optimistic locking.

## Key Learnings
- **The Invariance of Interactive Transactions**: Financial transfers require three distinct steps: debiting account A, crediting account B, and creating a ledger record. Wrapping all three inside Prisma's interactive `$transaction` guarantees that funds are never lost or created if a system failure occurs midway through.
- **Defense-in-Depth against Overdrafts**:
  - **Application Logic**: The debit update applies a conditional check (`WHERE id = fromId AND balanceCents >= amount`). If insufficient balance exists, the query updates 0 rows and aborts the transaction with `409 Conflict`.
  - **Database Constraint**: A PostgreSQL check constraint (`CHECK (balance_cents >= 0)`) provides an unbreakable guarantee at the storage layer.
- **Serializable Isolation & Serialization Failure Retries**: Running under PostgreSQL's highest isolation level (`Serializable`) guarantees transactions execute as if strictly serial. However, concurrent conflicting transactions cause serialization failures (Prisma error `P2034`). I built a retry engine that intercepts `P2034` errors and re-executes the transaction with exponential backoff and randomized jitter.
- **Graceful Contention Handling with HTTP 503**: If a transaction exhausts its maximum retry attempts under extreme lock contention, the API responds with `503 Service Unavailable` and a `Retry-After: 1` header, signaling to clients that the request is transiently blocked rather than broken by a 500 bug.
- **Durable Idempotency Keys**: Clients sending an `Idempotency-Key` header have their request hashed and stored alongside the transaction. Re-sending the identical key immediately returns the cached transaction response. If a client attempts to reuse an idempotency key with a different request payload, the server rejects it with `422 Unprocessable Entity`.
- **Optimistic Concurrency Control via ETags**: Account modifications utilize an integer `version` column exposed to clients as an HTTP `ETag` header. Mutating endpoints require `If-Match: "<version>"`. If a client sends a stale version (indicating another client updated the record in the meantime), the server responds with `412 Precondition Failed`. Missing headers return `428 Precondition Required`.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** (interactive transactions, Serializable isolation) + **PostgreSQL**
- **Jest** + **Supertest**

## Project Structure (Day 50)
```bash
day_50_database_transactions/
├── prisma/
│   ├── schema.prisma                  # Account, Transfer, and IdempotencyRecord models
│   └── migrations/
│       └── 20261008000000_add_balance_check_constraint/
│           └── migration.sql          # Hand-added CHECK constraint
├── src/
│   ├── services/
│   │   └── transfer.service.ts        # Atomic transfer logic with backoff retry loops
│   ├── routes/
│   │   └── index.ts                   # ETag, If-Match, and Idempotency-Key route handlers
│   ├── docs/
│   │   └── openapi.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/accounts` | Create an account with initial deposit (returns ETag) | 201 |
| GET | `/api/accounts/:id` | Read account state (returns ETag; supports 304 If-None-Match) | 200 / 304 / 404 |
| PATCH | `/api/accounts/:id` | Update account with If-Match version check | 200 / 412 / 428 |
| POST | `/api/transfers` | Atomic transfer between accounts (`Idempotency-Key` supported) | 201 / 409 / 422 / 503 |
| GET | `/api/transfers?accountId=`| Audit ledger of past transfers | 200 |

## Atomic Transfer & Retry Algorithm

```typescript
// src/services/transfer.service.ts snippet
export async function executeTransferWithRetry(params: TransferParams): Promise<TransferResult> {
  const maxRetries = 5;
  let delayMs = 50;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Conditional debit
          const updatedFrom = await tx.account.updateMany({
            where: { id: params.fromId, balanceCents: { gte: params.amountCents } },
            data: { balanceCents: { decrement: params.amountCents }, version: { increment: 1 } },
          });

          if (updatedFrom.count === 0) {
            throw new AppError('Insufficient funds for transfer', 409);
          }

          // Credit destination
          await tx.account.update({
            where: { id: params.toId },
            data: { balanceCents: { increment: params.amountCents }, version: { increment: 1 } },
          });

          // Ledger record
          return tx.transfer.create({ data: params });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err: any) {
      if (err.code === 'P2034' && attempt < maxRetries) {
        // Serialization conflict: backoff with jitter
        const jitter = Math.random() * 25;
        await new Promise((res) => setTimeout(res, delayMs + jitter));
        delayMs *= 2;
        continue;
      }
      throw err;
    }
  }
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_50_database_transactions
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Run concurrency and transaction test suite
pnpm test
```

### Challenges Faced & Solved
- **High-Contention Serialization Exhaustion in Smoke Tests**: When our smoke test suite executed 20 concurrent transfer requests against a single account with an initial balance only sufficient for 10 transfers, serialization conflicts surged. The initial retry policy gave up too early and returned 500 errors. Expanding retry attempts, introducing jittered exponential backoff, and mapping exhausted retries to `503 Service Unavailable + Retry-After` ensured that exactly 10 transfers succeeded and 10 were rejected with 409, with zero currency lost or leaked.
- **ETag Caching Validation**: Implemented support for `If-None-Match`, allowing clients to perform conditional `GET` requests that return `304 Not Modified` with zero response body when data has not changed.

### Next Steps
- Begin the Advanced Phase (Days 51–75) starting with HATEOAS (Hypermedia as the Engine of Application State) in Day 51 to achieve Richardson Maturity Model Level 3.

---

**Status: ✅ Day 50 Successfully Completed**  
**Progress: 50/100 Days (Haleway Milestone Reached!)**  
**Milestone: Intermediate phase completed! Full ACID transaction safety, serialization conflict retry loops, idempotency, and optimistic locking mastered.**
