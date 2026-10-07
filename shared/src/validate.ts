import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from './errors';

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed result.
 * Zod object schemas strip unknown keys by default, so fields like `role` that the
 * client must not control never reach the controller.
 */
export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError('Validation failed', 400, result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
