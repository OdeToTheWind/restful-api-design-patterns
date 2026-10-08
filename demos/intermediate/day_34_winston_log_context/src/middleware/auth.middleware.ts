import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { addToLogContext, AppError, isAuthUser } from '@restful/shared';

export const authenticate =
  (jwtSecret: string): RequestHandler =>
  (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new AppError('Access token required', 401));
    try {
      const decoded = jwt.verify(header.slice('Bearer '.length), jwtSecret, { algorithms: ['HS256'] });
      if (!isAuthUser(decoded)) return next(new AppError('Invalid token payload', 401));
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      // From here on, every log line of this request also says who made it
      addToLogContext({ userId: decoded.id });
      next();
    } catch {
      next(new AppError('Invalid or expired token', 401));
    }
  };
