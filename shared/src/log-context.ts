import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request log context. `requestId` (shared middleware) opens a context for every
 * request; anything logged while handling that request — in controllers, services,
 * repositories, after any number of awaits — automatically carries these fields.
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const storage = new AsyncLocalStorage<LogContext>();

/** Runs `fn` with its own log context (used by the requestId middleware, jobs and scripts). */
export const runWithLogContext = <T>(context: LogContext, fn: () => T): T => storage.run({ ...context }, fn);

/** The current request's context, or an empty object outside a request. */
export const getLogContext = (): LogContext => storage.getStore() ?? {};

/** Adds fields for the rest of the current request, e.g. `addToLogContext({ userId })` after authentication. */
export const addToLogContext = (values: LogContext): void => {
  const store = storage.getStore();
  if (store) Object.assign(store, values);
};

// Matches keys like password, newPassword, token, refreshToken, tokenHash, secret, clientSecret,
// apiKey, x-api-key, authorization, cookie, set-cookie
export const SENSITIVE_KEY = /pass(word)?|secret|token|api[-_]?key|authorization|cookie/i;
export const REDACTED = '[REDACTED]';

/** Returns a copy with every sensitive key masked, at any depth. Errors are kept as they are. */
export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 8 || value === null || typeof value !== 'object' || value instanceof Error || value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [key, SENSITIVE_KEY.test(key) ? REDACTED : redact(inner, depth + 1)]),
  );
};
