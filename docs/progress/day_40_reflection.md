# Day 40 - Asynchronous Email Notifications with BullMQ & Dead-Letter Handling

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Decouple email delivery from HTTP request-response lifecycles using **BullMQ and Redis**. The API must accept notification requests, enqueue jobs, and return `202 Accepted` instantly. A dedicated background worker delivers messages, implements intelligent exponential backoff for transient failures, halts on permanent errors, and exposes dead-letter visibility and manual retry endpoints for administrative oversight.

## Key Learnings
- **The 202 Accepted Pattern for Asynchronous Work**: Synchronously delivering emails inside HTTP handlers risks connection timeouts, blocks client response times, and drops notifications if downstream SMTP servers experience latency. Returning `202 Accepted` alongside a status polling URL provides an honest, reliable contract.
- **BullMQ on Redis for Durable Queueing**: Queue state resides in Redis with Append-Only File (AOF) persistence enabled. Jobs survive API restarts, and worker processes can scale horizontally across multiple instances independently of web nodes.
- **Differentiating Transient vs. Permanent Failures**:
  - **Transient Errors** (network blips, SMTP 4xx greylisting): Automatically retried using exponential backoff (`attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`).
  - **Permanent Errors** (invalid recipient syntax, SMTP 5xx rejections): The processor throws BullMQ's `UnrecoverableError`, immediately stopping doomed retry cycles.
- **Queue-Level Idempotency**: Mapping incoming `Idempotency-Key` headers directly to the BullMQ `jobId` guarantees that duplicate HTTP POST requests within the retention window do not spawn duplicate emails.
- **Dead-Letter Queue (DLQ) Visibility & Recovery**: When jobs exhaust retries, the worker fires a dead-letter alert log. To allow operational remediation, I implemented admin inspection (`GET /api/admin/emails/failed`) and replay endpoints (`POST /api/admin/emails/failed/:jobId/retry`) to review failure reasons and re-queue jobs without re-entering the original HTTP intake route.
- **Safe HTML Templating & Local Mailpit Testing**: Email templates are written as pure functions with HTML entity escaping to prevent injection attacks. Mailpit captures outgoing SMTP traffic in Docker without spamming real inboxes.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **BullMQ** + **Redis 7** (with AOF persistence)
- **nodemailer** + **Mailpit** (local SMTP test server and UI)
- **Jest** + **Supertest**

## Project Structure (Day 40)
```bash
day_40_email_notifications_queue/
├── src/
│   ├── emails/
│   │   ├── schema.ts            # Discriminated union of email event payloads
│   │   └── templates.ts         # Pure rendering functions with HTML escaping
│   ├── queue/
│   │   ├── email.queue.ts       # Queue setup, retry policies, and getFailed/retryJob helpers
│   │   └── email.processor.ts   # Worker job processor and UnrecoverableError classification
│   ├── worker.ts                # Standalone worker entry point with DLQ logging alerts
│   ├── app.ts                   # Express API with job enqueue, status, and DLQ admin endpoints
│   ├── docs/
│   │   └── openapi.ts           # OpenAPI contract including admin failure management
│   └── index.ts                 # Web server entry point
├── docker-compose.yml           # Redis (with persistence) + Mailpit
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/emails` | Enqueue email notification (supports `Idempotency-Key`) | 202 |
| GET | `/api/emails/:jobId` | Poll current queue delivery status | 200 / 404 |
| GET | `/api/admin/emails/failed` | List failed jobs in the dead-letter queue | 200 |
| POST | `/api/admin/emails/failed/:jobId/retry` | Re-queue a failed job for retry | 200 / 404 |

## Dead-Letter Recovery & Worker Logic

```typescript
// src/worker.ts - Dead-letter monitoring
worker.on('failed', (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    logger.error('CRITICAL: Email job permanently failed (Dead-Letter Alert)', {
      jobId: job.id,
      name: job.name,
      failedReason: err.message,
      data: job.data,
    });
  }
});

// src/queue/email.queue.ts - Admin retry
export async function retryFailedJob(jobId: string): Promise<boolean> {
  const job = await emailQueue.getJob(jobId);
  if (!job) return false;
  await job.retry();
  return true;
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_40_email_notifications_queue
cp .env.example .env
docker compose up -d          # Starts Redis + Mailpit (Web UI: http://localhost:8025)

# Terminal 1: Run API server
pnpm dev

# Terminal 2: Run Background Worker process
pnpm worker

# Run unit tests covering queueing, retry classification, and admin endpoints
pnpm test
```

### Challenges Faced & Solved
- **Redis Blocking Commands with BullMQ**: BullMQ requires `maxRetriesPerRequest: null` on its Redis client connection to allow blocking pop commands (`BRPOPLPUSH`) without triggering client-side timeouts. Failing to configure this caused worker disconnect crashes.
- **Decoupled Smoke Verification**: The test suite enqueues an email while the worker is purposely stopped, asserting that the job sits safely in `waiting` state. It then boots the worker and verifies that the message appears inside Mailpit, proving complete architectural decoupling between the web layer and background delivery.
- **Administrative Dead-Letter Re-queueing**: Added endpoints allowing support engineers to inspect why emails failed and replay them with one click after fixing downstream issues.

### Next Steps
- Implement cryptographically signed webhook reception with replay protection and idempotency in Day 41.

---

**Status: ✅ Day 40 Successfully Completed**  
**Progress: 40/100 Days**  
**Milestone: Enterprise-grade asynchronous message queue architecture built with BullMQ, dead-letter monitoring, and admin recovery.**
