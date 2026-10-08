import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3038),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    JWT_SECRET: envFields.secret(32),
    CORS_ORIGIN: envFields.csv,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  accessTokenTtlSeconds: 15 * 60,
  corsOrigins: env.CORS_ORIGIN,
};
