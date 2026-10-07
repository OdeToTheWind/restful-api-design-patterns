import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from './errors';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates one part of the request against a Zod schema and replaces it with the parsed
 * result (trimmed, coerced, unknown keys stripped). Failures become a 400 with field errors.
 */
const validatePart =
  (part: RequestPart, schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(new AppError('Validation failed', 400, result.error.flatten().fieldErrors));
    }
    req[part] = result.data;
    next();
  };

/**
 * Validates `req.body`. Zod object schemas strip unknown keys by default, so fields like
 * `role` that the client must not control never reach the controller.
 */
export const validateBody = (schema: ZodTypeAny): RequestHandler => validatePart('body', schema);

/** Validates `req.query` — use `z.coerce.number()` etc., since query values arrive as strings. */
export const validateQuery = (schema: ZodTypeAny): RequestHandler => validatePart('query', schema);

/** Validates route params such as `:id`, so malformed ids fail with 400 before reaching the database. */
export const validateParams = (schema: ZodTypeAny): RequestHandler => validatePart('params', schema);
