# Day 40 - Email Notifications with a Queue

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

> 📝 **Draft** — review it and rewrite the learnings and challenges in my own words before treating it as final.

## Objective
Send emails **outside the request**: the API enqueues a job and answers `202 Accepted`; a separate worker delivers it, retrying temporary failures.

## Key Learnings
- `202 Accepted` + a status URL is the honest answer when work happens later
- BullMQ jobs live in Redis, so they survive restarts; the worker is its own process and scales separately
- Retries with exponential backoff for temporary failures (SMTP down, 4xx greylisting)
- Permanent failures (SMTP 5xx) throw `UnrecoverableError` so they stop immediately instead of retrying for nothing
- `Idempotency-Key` → fixed job id: a retried request never sends the same email twice
- Templates are pure functions with HTML escaping; Mailpit catches every email locally

## Tech Stack Used
- **Node.js** + **TypeScript**, **Express.js**
- **BullMQ** + **Redis**
- **nodemailer**, **Mailpit**
- **Jest** + **Supertest**

## Project Structure (Day 40)
```
src/emails/schema.ts         ← discriminated union of email types
src/emails/templates.ts      ← pure rendering, HTML-escaped
src/queue/email.queue.ts     ← queue + retry/cleanup policy
src/queue/email.processor.ts ← send, classify temporary vs permanent failures
src/worker.ts                ← the worker process (pnpm worker)
```

## API Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emails` | Queue an email (202, `Idempotency-Key` supported) |
| GET | `/api/emails/:jobId` | Delivery status |

## How to Run
```bash
pnpm install
cd demos/intermediate/day_40_email_notifications_queue
cp .env.example .env
docker compose up -d          # Redis + Mailpit (inbox: http://localhost:8025)
pnpm dev                      # API
pnpm worker                   # in a second terminal
```

### Challenges Faced & Solved
- BullMQ needs `maxRetriesPerRequest: null` on its Redis connection, otherwise blocking commands get cut off
- The smoke test enqueues while no worker runs (the job waits), then starts the worker and finds the email in Mailpit — proving the API and the delivery are really decoupled
- Queue Redis keeps persistence on (AOF), unlike the cache Redis on Day 33

### Next Steps
- Day 41: receive webhooks safely
