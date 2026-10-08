import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3042),
    NODE_ENV: envFields.nodeEnv,
    CORS_ORIGIN: envFields.csv,
    // When v1 was deprecated, and when it stops working (410 Gone)
    V1_DEPRECATED_AT: z.coerce.date().default(new Date('2026-10-01T00:00:00Z')),
    V1_SUNSET_AT: z.coerce.date().default(new Date('2027-04-01T00:00:00Z')),
  }),
);

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  v1: { deprecatedAt: Date; sunsetAt: Date };
}

export const config: AppConfig = {
  port: env.PORT,
  corsOrigins: env.CORS_ORIGIN,
  v1: { deprecatedAt: env.V1_DEPRECATED_AT, sunsetAt: env.V1_SUNSET_AT },
};
