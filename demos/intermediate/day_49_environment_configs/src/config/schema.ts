import { envFields } from '@restful/shared';
import { z } from 'zod';

/**
 * Every setting the app reads, in one schema. Values arrive as strings and are coerced;
 * defaults suit development; production adds stricter rules (superRefine below).
 */
export const envSchema = z
  .object({
    NODE_ENV: envFields.nodeEnv,
    PORT: envFields.port(3049),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    CORS_ORIGIN: envFields.csv,
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10_000).default(120),
    FEATURE_NEW_GREETING: envFields.flag,
    // Enables /api/admin/config. Optional in development, required in production.
    ADMIN_API_KEY: z.string().min(32, 'must be at least 32 characters').optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (!env.ADMIN_API_KEY) fail('ADMIN_API_KEY', 'is required in production');
    if (env.CORS_ORIGIN.includes('*')) fail('CORS_ORIGIN', 'must list explicit origins in production, not *');
    if (env.LOG_LEVEL === 'debug') fail('LOG_LEVEL', 'debug logging is not allowed in production');
  });

export type Env = z.infer<typeof envSchema>;
