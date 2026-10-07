import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3043),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    JWT_SECRET: envFields.secret(32),
    AUTH_RATE_LIMIT: z.coerce.number().int().min(1).default(10),
    // Browser apps allowed to call the API with cookies (credentials) — must be explicit origins
    CORS_ORIGIN: envFields.csv,
    // Cookies are Secure (HTTPS-only) in production; set COOKIE_SECURE=true to test that locally over HTTPS
    COOKIE_SECURE: envFields.flag,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  authRateLimit: env.AUTH_RATE_LIMIT,
  corsOrigins: env.CORS_ORIGIN,
  cookieSecure: env.NODE_ENV === 'production' || env.COOKIE_SECURE,
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 7,
};
