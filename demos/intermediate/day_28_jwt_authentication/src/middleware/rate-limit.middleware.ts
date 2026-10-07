import rateLimit from 'express-rate-limit';
import { ApiResponse } from '@restful/shared';
import { config } from '../config';

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
