import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, isAuthUser } from '@restful/shared';
import { config } from '../config';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError('Access token required', 401));

  try {
    const decoded = jwt.verify(header.slice('Bearer '.length), config.jwtSecret, { algorithms: ['HS256'] });
    if (!isAuthUser(decoded)) return next(new AppError('Invalid token payload', 401));
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') return next(new AppError('Access denied. Insufficient permissions.', 403));
  next();
};
