import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
    limit: config.rateLimitMax,
    windowMinutes: config.rateLimitWindowMs / 60000
  },
  standardHeaders: true,
  legacyHeaders: false,
});