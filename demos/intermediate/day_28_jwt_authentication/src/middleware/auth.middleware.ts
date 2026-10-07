import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, isAuthUser } from '@restful/shared';
import { config } from '../config';

export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Access token required', 401));
  }

  try {
    // Pin the algorithm so a token can't pick its own verification method
    const decoded = jwt.verify(authHeader.slice('Bearer '.length), config.jwtSecret, { algorithms: ['HS256'] });

    if (!isAuthUser(decoded)) {
      return next(new AppError('Invalid token payload', 401));
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
