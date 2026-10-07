import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3023,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
};