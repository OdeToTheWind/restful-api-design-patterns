import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3034),
    NODE_ENV: envFields.nodeEnv,
    // Unset = the default for the environment (see below)
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
    JWT_SECRET: envFields.secret(32),
    CORS_ORIGIN: envFields.csv,
  }),
);

// Per-environment defaults: everything locally, the essentials in production, only problems in tests
const DEFAULT_LOG_LEVEL = { development: 'debug', test: 'error', production: 'info' } as const;

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  jwtSecret: string;
  corsOrigins: string[];
  /** GET /api/debug/logs — never in production */
  exposeRecentLogs: boolean;
}

export const config: AppConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL[env.NODE_ENV],
  jwtSecret: env.JWT_SECRET,
  corsOrigins: env.CORS_ORIGIN,
  exposeRecentLogs: env.NODE_ENV !== 'production',
};
