import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

// The whole environment is validated once at startup; a bad or missing value stops the app
// with a list of every problem. Add secrets as e.g. `JWT_SECRET: envFields.secret(32)`.
const env = loadEnv(
  z.object({
    PORT: envFields.port(3041),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    // Allowed browser origins, comma-separated. Empty = no cross-origin access.
    CORS_ORIGIN: envFields.csv,
    // Shared with the payment provider; used to verify every webhook
    WEBHOOK_SECRET: envFields.secret(32),
    WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(1).max(3600).default(300),
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  corsOrigins: env.CORS_ORIGIN,
  webhookSecret: env.WEBHOOK_SECRET,
  webhookToleranceSeconds: env.WEBHOOK_TOLERANCE_SECONDS,
};
