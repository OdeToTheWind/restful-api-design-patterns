import dotenv from 'dotenv';
import { envFields, loadEnv } from '@restful/shared';
import { z } from 'zod';

dotenv.config();

const env = loadEnv(
  z.object({
    PORT: envFields.port(3039),
    NODE_ENV: envFields.nodeEnv,
    DATABASE_URL: z.string().url(),
    CORS_ORIGIN: envFields.csv,
    // Any S3-compatible storage: SeaweedFS locally (docker-compose.yml), AWS S3 in production
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().min(3).default('uploads'),
    S3_ACCESS_KEY_ID: z.string().min(3),
    S3_SECRET_ACCESS_KEY: envFields.secret(8),
    // Create the bucket at startup if missing (handy locally; production buckets are provisioned separately)
    S3_CREATE_BUCKET: envFields.flag,
    MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .min(1)
      .default(5 * 1024 * 1024),
  }),
);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  corsOrigins: env.CORS_ORIGIN,
  s3: {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    createBucket: env.S3_CREATE_BUCKET,
  },
  maxUploadBytes: env.MAX_UPLOAD_BYTES,
  allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const,
  uploadUrlTtlSeconds: 5 * 60,
  downloadUrlTtlSeconds: 60,
};
