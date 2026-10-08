import { timingSafeEqual } from 'node:crypto';
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ApiResponse, AppError, isAuthUser } from '@restful/shared';
import { config } from '../config';
import { CSRF_COOKIE, CSRF_HEADER } from '../lib/cookies';

/** Bearer access token → req.user, plus the session id (`sid` claim) in res.locals. */
export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError('Access token required', 401));

  try {
    const decoded = jwt.verify(header.slice('Bearer '.length), config.jwtSecret, { algorithms: ['HS256'] });
    if (!isAuthUser(decoded)) return next(new AppError('Invalid token payload', 401));
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    const sid = (decoded as { sid?: unknown }).sid;
    res.locals.sessionId = typeof sid === 'string' ? sid : undefined;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Double-submit CSRF check for the cookie-authenticated endpoints (/refresh, /logout).
 * A malicious site can make the browser send our cookies, but it can't read the csrf_token
 * cookie to copy it into the header, so its forged requests fail here.
 */
export const requireCsrf: RequestHandler = (req, _res, next) => {
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get(CSRF_HEADER);
  if (typeof cookie !== 'string' || !header || !safeEqual(cookie, header)) {
    return next(new AppError('Missing or invalid CSRF token', 403));
  }
  next();
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many attempts, please try again later', 429);
  },
});
