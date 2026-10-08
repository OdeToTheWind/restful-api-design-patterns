import winston from 'winston';
import { getLogContext, redact, REDACTED, SENSITIVE_KEY } from './log-context';

const isProduction = process.env.NODE_ENV === 'production';

/** Adds requestId/userId/… from the current request's context to every log entry. */
const withContext = winston.format((info) => {
  for (const [key, value] of Object.entries(getLogContext())) {
    if (info[key] === undefined && value !== undefined) info[key] = value;
  }
  return info;
});

/**
 * Masks sensitive fields (passwords, tokens, cookies, API keys…) before anything is written.
 * Only structured fields can be protected: never interpolate secrets into the message text.
 */
const redactSecrets = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message') continue;
    info[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(info[key]);
  }
  return info;
});

/**
 * Structured logger shared by every demo (Winston, as introduced on Day 14).
 * - production: one JSON object per line, ready for a log collector
 * - development: colourised, human-readable lines
 * - test: silent unless LOG_LEVEL is set, so test output stays readable
 * Every entry gets the request context and has its secrets redacted.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  silent: process.env.NODE_ENV === 'test' && !process.env.LOG_LEVEL,
  format: winston.format.combine(
    withContext(),
    redactSecrets(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction ? winston.format.json() : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  transports: [new winston.transports.Console()],
});
