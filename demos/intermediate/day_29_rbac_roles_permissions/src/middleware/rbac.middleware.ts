import { RequestHandler } from 'express';
import { AppError } from '@restful/shared';
import type { Role } from '../../generated/prisma';

/**
 * RBAC authorization middleware factory.
 * Usage: router.get('/admin', authenticate, authorizeRoles('ADMIN'), handler)
 * `Role` comes from the Prisma schema, so a typo like authorizeRoles('ADMN') fails to compile.
 */
export const authorizeRoles = (...allowedRoles: Role[]): RequestHandler => {
  const allowed: readonly string[] = allowedRoles;

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }
    next();
  };
};
