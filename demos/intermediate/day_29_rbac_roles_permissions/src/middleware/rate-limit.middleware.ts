import rateLimit from 'express-rate-limit';
import { ApiResponse } from '@restful/shared';
import { config } from '../config';
import { LoginInput } from '../validators/auth.schema';

// Slows down brute-force / credential-stuffing attacks on login and register
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many attempts, please try again later', 429);
  },
});

// Per account: an attacker rotating IPs is still limited to N wrong passwords per email.
// Successful logins don't count, so the real user is never locked out by their own logins.
// Must run AFTER validateBody(loginSchema), which normalises the email used as the key.
export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginAccountLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${(req.body as LoginInput).email}`,
  handler: (_req, res) => {
    ApiResponse.error(res, 'Too many failed attempts for this account, please try again later', 429);
  },
});
