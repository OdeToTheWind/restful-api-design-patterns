import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from './logger';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// Accept a caller's id only if it is short and plain, so it can't inject into logs
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

/**
 * Gives every request an id (reusing a safe incoming `X-Request-Id`, e.g. from a gateway),
 * exposes it as `req.id`, and echoes it back in the response header so clients can quote it
 * when reporting a problem. Register it first in app.ts.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  req.id = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, req.id);
  next();
};

/** Logs one line per request when the response finishes: method, path, status, duration. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    });
  });

  next();
};
