import { timingSafeEqual } from 'node:crypto';
import { RequestHandler } from 'express';
import { AppError } from '@restful/shared';
import { config } from '../config';

const safeEqual = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const requireAdminKey: RequestHandler = (req, _res, next) => {
  if (!config.adminApiKey) {
    return next(new AppError('Admin API is disabled (ADMIN_API_KEY not set)', 404));
  }
  const presented = req.get('X-Admin-Key');
  if (!presented || !safeEqual(presented, config.adminApiKey)) {
    return next(new AppError('Unauthorized: missing or invalid admin key', 401));
  }
  next();
};
