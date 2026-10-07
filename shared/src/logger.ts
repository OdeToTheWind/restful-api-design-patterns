import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Structured logger shared by every demo (Winston, as introduced on Day 14).
 * - production: one JSON object per line, ready for a log collector
 * - development: colourised, human-readable lines
 * - test: silent unless LOG_LEVEL is set, so test output stays readable
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  silent: process.env.NODE_ENV === 'test' && !process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  transports: [new winston.transports.Console()],
});
