# Day 41 - Webhook Endpoints

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Receive payment webhooks safely: **verify the signature**, reject replays, and process each event **exactly once** even though providers deliver at least once.

## Key Learnings
- HMAC-SHA256 over `timestamp.rawBody`, compared in constant time; several `v1` signatures allow secret rotation
- The route reads the **raw** body (mounted before `express.json()`): re-serialised JSON wouldn't match the signature
- Timestamp tolerance (5 minutes) blocks replays, and the timestamp is signed so it can't be swapped
- Idempotency through a unique `eventId`: the event row and the order update commit in one transaction; a redelivery hits the unique constraint → 200 `duplicate`
- Only `PENDING` orders move: late or out-of-order events can't undo a final state
- Unknown event types are acknowledged (200) so the provider stops retrying

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Prisma** + **PostgreSQL**
- Node `crypto` (HMAC, timingSafeEqual)
- **Jest** + **Supertest**

## Project Structure (Day 41)
```
src/webhooks/signature.ts       ← sign / verify (pure, unit-tested)
src/webhooks/events.ts          ← event schemas
src/webhooks/webhook.router.ts  ← raw body → verify → idempotent transaction
scripts/send-webhook.ts         ← plays the provider (pnpm webhook:send)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/payments` | Signed provider callback |
| POST | `/api/orders` | Create a PENDING order |
| GET | `/api/orders/:id` | Order status |
| GET | `/api/webhooks/events` | Processed events |

## How to Run
```bash
pnpm install                      # from the repo root
cd demos/intermediate/day_41_webhook_endpoints
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm webhook:send <orderId> payment.succeeded
pnpm dev                          # Swagger UI: /api/docs
pnpm test
```

### Challenges Faced & Solved
- A test proves the raw-body requirement: the same JSON re-formatted with the original signature is rejected
- Two deliveries of the same new event can race; the unique constraint decides, and the loser reports `duplicate`

### Next Steps
- Day 42: version the API
