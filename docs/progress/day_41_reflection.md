# Day 41 - Secure Webhook Endpoints & Signature Verification

**Level**: Intermediate  
**Date**: October 8, 2026  
**Status**: ✅ Completed

## Objective
Design and implement a hardened **payment webhook receiver** capable of safely handling at-least-once provider deliveries. The endpoint must verify cryptographic HMAC signatures, enforce strict replay protection, guarantee idempotent exactly-once processing, and gracefully handle unknown event schemas.

## Key Learnings
- **HMAC-SHA256 Cryptographic Verification**: Webhooks travel over the public internet, so payloads must be authenticated with HMAC-SHA256 computed across `timestamp.rawBody`. Comparing signatures using Node's `crypto.timingSafeEqual` prevents timing-attack vulnerabilities.
- **The Critical Raw-Body Requirement**: Express's default `express.json()` parses the request stream into JavaScript objects. If an application attempts to re-stringify that object (`JSON.stringify(req.body)`), subtle differences in whitespace, key ordering, or character escaping break the cryptographic hash. Mounting the webhook router with raw buffer capture (`express.raw({ type: 'application/json' })`) preserves the exact wire bytes sent by the provider.
- **Replay Attack Defense**: Requiring a signed timestamp and enforcing a strict 5-minute tolerance window prevents malicious third parties from intercepting and replaying historical webhook requests. Because the timestamp is incorporated into the signed HMAC payload, attackers cannot modify it.
- **Exactly-Once Processing via Idempotent Transactions**: Webhook providers operate on at-least-once delivery semantics. To prevent duplicate billing or fulfillment, each webhook records a unique `eventId` in PostgreSQL within the same database transaction that updates the order. Redeliveries trip the unique constraint, and the handler gracefully answers `200 { status: 'duplicate' }` so the provider halts retry attempts.
- **Strict State Machine Guards**: Only orders in `PENDING` status may transition to `PAID` or `CANCELLED`. Late-arriving, duplicate, or out-of-sequence webhook events cannot mutate an order already in a terminal state.
- **Safe Acknowledgement of Unhandled Events**: Unknown or unhandled event types return an immediate `200 OK` rather than a 4xx or 500 error, signaling to the provider that the event was received and preventing endless retry storms.

## Tech Stack Used
- **Node.js** + **TypeScript** + **Express.js**
- **Prisma** + **PostgreSQL**
- **Node.js `crypto` module** (HMAC-SHA256, timingSafeEqual)
- **Jest** + **Supertest**

## Project Structure (Day 41)
```bash
day_41_webhook_endpoints/
├── src/
│   ├── webhooks/
│   │   ├── signature.ts         # Pure HMAC verification and signing logic
│   │   ├── events.ts            # Zod schemas for supported webhook payloads
│   │   └── webhook.router.ts    # Raw body capture, signature check, and transaction
│   ├── controllers/
│   │   └── order.controller.ts  # Standard order creation and status queries
│   ├── routes/
│   │   └── index.ts
│   ├── app.ts                   # Webhook route mounted before standard json parser
│   └── index.ts
├── scripts/
│   └── send-webhook.ts          # CLI test harness simulating provider events
├── prisma/
│   └── schema.prisma            # Order and WebhookEvent models with unique eventId
├── package.json
└── tsconfig.json
```

## API Endpoints Implemented

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/webhooks/payments` | Ingests signed provider callbacks | 200 / 400 / 401 |
| POST | `/api/orders` | Creates a new order in PENDING status | 201 |
| GET | `/api/orders/:id` | Returns order details and payment state | 200 / 404 |
| GET | `/api/webhooks/events` | Audit log of processed webhook event IDs | 200 |

## Signature Verification Implementation

```typescript
// src/webhooks/signature.ts
import crypto from 'node:crypto';

export function verifyWebhookSignature({
  rawBody,
  signatureHeader,
  secret,
  toleranceSeconds = 300,
}: {
  rawBody: Buffer | string;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
}): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => part.trim().split('='))
  );

  const timestamp = parseInt(parts.t, 10);
  const signature = parts.v1;

  if (isNaN(timestamp) || !signature) return false;

  // Reject expired timestamps (replay attack prevention)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  const payload = `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

## How to Run & Verify

```bash
cd demos/intermediate/day_41_webhook_endpoints
cp .env.example .env
docker compose up -d
pnpm prisma:migrate
pnpm dev

# Simulate an external payment event via CLI
pnpm webhook:send <orderId> payment.succeeded

# Run unit and contract tests verifying tampered bodies and replay prevention
pnpm test
```

### Challenges Faced & Solved
- **Proving the Raw-Body Invariant**: To prove why `express.raw` is mandatory, I authored a unit test that takes a valid JSON payload, reformats its whitespace indentation, and re-submits it with the original signature. As expected, the signature verification failed, proving that byte-level preservation is non-negotiable.
- **Concurrent Webhook Race Conditions**: If a provider delivers two instances of the same event simultaneously across two threads, both could check whether the event exists, see `false`, and attempt to update the order. Enclosing the event insertion and order update in a single transaction with a unique database index on `eventId` ensures the loser immediately gets a unique constraint collision and safely returns 200 `duplicate`.

### Next Steps
- Implement REST API URI versioning with standards-compliant RFC deprecation headers in Day 42.

---

**Status: ✅ Day 41 Successfully Completed**  
**Progress: 41/100 Days**  
**Milestone: Production webhook intake architecture implemented with HMAC verification, replay defense, and transactional idempotency.**
