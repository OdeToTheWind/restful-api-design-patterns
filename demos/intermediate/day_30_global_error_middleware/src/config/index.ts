import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

// Validated once at startup; any invalid value stops the app with a list of every problem
const env = loadEnv(
  z.object({
    PORT: envFields.port(3029),
    NODE_ENV: envFields.nodeEnv,
    // Allowed browser origins, comma-separated. Empty = no cross-origin access.
    CORS_ORIGIN: envFields.csv,
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigins: env.CORS_ORIGIN,
};
