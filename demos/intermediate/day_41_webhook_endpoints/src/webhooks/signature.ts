import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Header format (same idea as Stripe):  Webhook-Signature: t=1728370000,v1=<hex>[,v1=<hex>…]
 * The signature is HMAC-SHA256(secret, `${t}.${rawBody}`) — the timestamp is signed too, so an
 * attacker can't replay an old request with a fresh timestamp. Several v1 values are allowed
 * so the provider can rotate secrets without downtime.
 */
export const SIGNATURE_HEADER = 'Webhook-Signature';

export const sign = (secret: string, timestamp: number, rawBody: string): string =>
  createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

export const signatureHeader = (secret: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)): string =>
  `t=${timestamp},v1=${sign(secret, timestamp, rawBody)}`;

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export const verifySignature = (
  header: string | undefined,
  rawBody: string,
  secret: string,
  { toleranceSeconds = 300, now = Math.floor(Date.now() / 1000) } = {},
): VerifyResult => {
  if (!header) return { ok: false, reason: 'missing signature header' };

  const parts = header.split(',').map((part) => part.trim().split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key, value]) => key === 'v1' && value).map(([, value]) => value);
  if (!Number.isInteger(timestamp) || signatures.length === 0)
    return { ok: false, reason: 'malformed signature header' };

  // Too old = possible replay; too far in the future = clock problem or forgery
  if (Math.abs(now - timestamp) > toleranceSeconds) return { ok: false, reason: 'timestamp outside tolerance' };

  const expected = Buffer.from(sign(secret, timestamp, rawBody), 'hex');
  const matches = signatures.some((candidate) => {
    const given = Buffer.from(candidate, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  return matches ? { ok: true } : { ok: false, reason: 'signature mismatch' };
};
