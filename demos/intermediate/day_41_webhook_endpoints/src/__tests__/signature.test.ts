import { sign, signatureHeader, verifySignature } from '../webhooks/signature';

const SECRET = 'whsec_test_only_secret_at_least_32_chars';
const body = JSON.stringify({ id: 'evt_1', type: 'payment.succeeded' });
const now = 1_760_000_000;

describe('verifySignature', () => {
  it('accepts a correctly signed body', () => {
    expect(verifySignature(signatureHeader(SECRET, body, now), body, SECRET, { now })).toEqual({ ok: true });
  });

  it.each([
    [
      'a tampered body',
      signatureHeader(SECRET, body, now),
      body.replace('succeeded', 'failed'),
      SECRET,
      'signature mismatch',
    ],
    [
      'the wrong secret',
      signatureHeader('another-secret-entirely-xxxxxxxxxxx', body, now),
      body,
      SECRET,
      'signature mismatch',
    ],
    ['a missing header', undefined, body, SECRET, 'missing signature header'],
    ['a header without v1', `t=${now}`, body, SECRET, 'malformed signature header'],
    ['a non-numeric timestamp', `t=soon,v1=${sign(SECRET, now, body)}`, body, SECRET, 'malformed signature header'],
  ])('rejects %s', (_case, header, rawBody, secret, reason) => {
    expect(verifySignature(header, rawBody, secret, { now })).toEqual({ ok: false, reason });
  });

  it('rejects replays: a valid signature from 10 minutes ago is refused', () => {
    const old = signatureHeader(SECRET, body, now - 600);
    expect(verifySignature(old, body, SECRET, { now })).toEqual({ ok: false, reason: 'timestamp outside tolerance' });
  });

  it('rejects timestamps too far in the future', () => {
    expect(verifySignature(signatureHeader(SECRET, body, now + 600), body, SECRET, { now }).ok).toBe(false);
  });

  it('the timestamp is part of what is signed — swapping in a fresh one breaks the signature', () => {
    const oldSignature = sign(SECRET, now - 600, body);
    expect(verifySignature(`t=${now},v1=${oldSignature}`, body, SECRET, { now })).toEqual({
      ok: false,
      reason: 'signature mismatch',
    });
  });

  it('accepts any of several v1 signatures (secret rotation)', () => {
    const header = `t=${now},v1=${sign('old-secret-being-rotated-out-xxxxx', now, body)},v1=${sign(SECRET, now, body)}`;
    expect(verifySignature(header, body, SECRET, { now })).toEqual({ ok: true });
  });
});
