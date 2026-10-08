import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

// Validated once at startup; any invalid value stops the app with a list of every problem.
// JWT_SECRET has no default on purpose: never sign tokens with a secret committed to git.
const env = loadEnv(
  z.object({
    PORT: envFields.port(3029),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    JWT_SECRET: envFields.secret(32),
    // Max auth attempts per IP per 15 minutes
    AUTH_RATE_LIMIT: z.coerce.number().int().min(1).default(10),
    // Max FAILED logins per account (email) per 15 minutes, from any number of IPs
    LOGIN_ACCOUNT_LIMIT: z.coerce.number().int().min(1).default(5),
    // Allowed browser origins, comma-separated. Empty = no cross-origin access.
    CORS_ORIGIN: envFields.csv,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  // Short-lived access tokens; clients renew them with a refresh token
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 7,
  authRateLimit: env.AUTH_RATE_LIMIT,
  loginAccountLimit: env.LOGIN_ACCOUNT_LIMIT,
  corsOrigins: env.CORS_ORIGIN,
};
