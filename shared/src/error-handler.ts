import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './errors';
import { logger } from './logger';
import { ApiResponse } from './response';

interface NormalizedError {
  statusCode: number;
  message: string;
  errors: unknown;
}

const hasProp = <K extends string>(value: unknown, key: K): value is Record<K, unknown> =>
  typeof value === 'object' && value !== null && key in value;

/**
 * Turns any thrown value into a status code + client-safe message.
 * DB errors are detected by shape so this package does not depend on Prisma or Mongoose.
 */
export const normalizeError = (err: unknown): NormalizedError => {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  // body-parser errors (malformed JSON, payload too large) carry a safe `status` + `expose`
  if (hasProp(err, 'status') && hasProp(err, 'expose') && err.expose === true && typeof err.status === 'number') {
    return {
      statusCode: err.status,
      message: String(hasProp(err, 'message') ? err.message : 'Bad Request'),
      errors: null,
    };
  }

  // Prisma known request errors
  if (hasProp(err, 'code') && typeof err.code === 'string') {
    if (err.code === 'P2002') return { statusCode: 409, message: 'Resource already exists', errors: null };
    if (err.code === 'P2025') return { statusCode: 404, message: 'Resource not found', errors: null };
    // Foreign key violation: the request refers to a related record that doesn't exist
    if (err.code === 'P2003') return { statusCode: 422, message: 'Referenced resource does not exist', errors: null };
  }

  // Mongoose errors
  if (hasProp(err, 'name')) {
    if (err.name === 'CastError') return { statusCode: 400, message: 'Invalid id format', errors: null };
    if (err.name === 'ValidationError') {
      return {
        statusCode: 400,
        message: String(hasProp(err, 'message') ? err.message : 'Validation failed'),
        errors: null,
      };
    }
  }

  return { statusCode: 500, message: 'Internal Server Error', errors: null };
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

/**
 * Global error middleware — register it LAST, after all routes and `notFoundHandler`.
 * Express identifies error middleware by its 4-argument signature, so `_next` must stay.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { statusCode, message, errors } = normalizeError(err);

  // Only unexpected errors are logged with their stack; 4xx are already in the request log
  if (statusCode >= 500) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, { requestId: req.id, error: err });
  }

  ApiResponse.error(res, message, statusCode, errors);
};
