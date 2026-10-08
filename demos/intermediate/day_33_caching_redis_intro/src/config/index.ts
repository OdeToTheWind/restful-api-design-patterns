import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3033),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    // How long a cached entry may live even if nothing invalidates it (safety net)
    CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(86_400).default(60),
    CORS_ORIGIN: envFields.csv,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  cacheTtlSeconds: env.CACHE_TTL_SECONDS,
  corsOrigins: env.CORS_ORIGIN,
};
