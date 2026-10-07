import dotenv from 'dotenv';

dotenv.config();

// Fail fast at startup instead of silently signing tokens with a secret committed to git
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
};

export const config = {
  port: process.env.PORT || 3028,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: requireEnv('JWT_SECRET'),
  // Short-lived access tokens; clients renew them with a refresh token
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlDays: 7,
  // Max auth attempts per IP per 15 minutes
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  // Comma-separated allow-list, e.g. "http://localhost:5173". Unset = no cross-origin access.
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [],
};
