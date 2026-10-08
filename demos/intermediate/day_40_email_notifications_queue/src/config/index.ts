import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3040),
    NODE_ENV: envFields.nodeEnv,
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    // docker-compose.yml runs Mailpit: SMTP on 1025, inbox UI on http://localhost:8025
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().default(1025),
    MAIL_FROM: z.string().default('Day 40 <no-reply@example.com>'),
    EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
    CORS_ORIGIN: envFields.csv,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  redisUrl: env.REDIS_URL,
  smtp: { host: env.SMTP_HOST, port: env.SMTP_PORT },
  mailFrom: env.MAIL_FROM,
  maxAttempts: env.EMAIL_MAX_ATTEMPTS,
  corsOrigins: env.CORS_ORIGIN,
};
