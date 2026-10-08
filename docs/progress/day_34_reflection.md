# Day 34 - Log Context

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Make every log line answer **which request, which user, which endpoint** — without passing that information through every function — and make sure secrets never reach the logs.

## Key Learnings
- `AsyncLocalStorage` gives each request its own context that follows it through every `await`
- The shared `requestId` middleware opens the context; `addToLogContext({ userId })` after authentication adds the user
- A Winston format copies the context into every entry, so a service three layers deep logs `requestId` and `userId` automatically
- Child loggers (`logger.child({ component })`) add fields that are fixed for a module
- Redaction as a format: keys like `password`, `token`, `cookie`, `apiKey` are masked at any depth before anything is written
- Logging the route **pattern** (`/api/orders/:id`) rather than the URL keeps logs groupable
- Per-environment levels: debug locally, info in production, error in tests

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **Winston** (custom formats + transport), `AsyncLocalStorage`
- **jsonwebtoken**
- **Jest** + **Supertest**

## Project Structure (Day 34)
```
shared/src/log-context.ts      ← AsyncLocalStorage context + redact()
shared/src/logger.ts           ← formats: add context, redact secrets
src/services/order.service.ts  ← logs without knowing the request
src/lib/recent-logs.ts         ← in-memory transport behind /api/debug/logs
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place an order (logs at several layers) |
| GET | `/api/orders/:id` | Your order |
| GET | `/api/debug/logs?requestId=` | What was actually written (development only) |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_34_winston_log_context
cp .env.example .env
pnpm dev
pnpm test
```

### Challenges Faced & Solved
- Only structured fields can be redacted — a secret interpolated into the message text can't be detected, so messages stay free of data
- The `finish` event of a response doesn't run inside the request's async context, so the request log line passes `requestId` explicitly
- Concurrent requests must never see each other's context — covered by a test that runs three at once

### Next Steps
- Day 36: soft deletes
