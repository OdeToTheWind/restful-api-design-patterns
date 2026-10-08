// Plays the payment provider: signs an event with WEBHOOK_SECRET and POSTs it.
// Usage: pnpm webhook:send <orderId> [payment.succeeded|payment.failed] [eventId]
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { SIGNATURE_HEADER, signatureHeader } from '../src/webhooks/signature';

const [orderId, type = 'payment.succeeded', eventId = `evt_${randomUUID()}`] = process.argv.slice(2);
const secret = process.env.WEBHOOK_SECRET;
const url = `http://localhost:${process.env.PORT ?? 3041}/api/webhooks/payments`;

if (!orderId || !secret) {
  console.error('Usage: pnpm webhook:send <orderId> [type] [eventId]   (WEBHOOK_SECRET must be set)');
  process.exit(1);
}

const body = JSON.stringify({ id: eventId, type, data: { orderId, amountCents: 0 } });
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: signatureHeader(secret, body) },
  body,
})
  .then(async (res) => console.log(res.status, await res.text()))
  .catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
