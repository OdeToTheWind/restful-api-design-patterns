import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

// The whole environment is validated once at startup; a bad or missing value stops the app
// with a list of every problem. Add secrets as e.g. `JWT_SECRET: envFields.secret(32)`.
const env = loadEnv(
  z.object({
    PORT: envFields.port(3044),
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
