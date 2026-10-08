import { z, ZodTypeAny } from 'zod';

/**
 * Validates the whole environment against one schema at startup and returns a typed,
 * coerced config object. Every problem is reported at once, so a misconfigured
 * deployment fails immediately with a readable list instead of crashing later.
 */
export const loadEnv = <T extends ZodTypeAny>(schema: T, source: NodeJS.ProcessEnv = process.env): z.infer<T> => {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}\nSee .env.example for every variable.`);
  }
  return result.data;
};

/** Reusable env field schemas. Env values are always strings, so these coerce. */
export const envFields = {
  port: (fallback: number) => z.coerce.number().int().min(1).max(65535).default(fallback),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  /** Comma-separated list → string[] (empty or unset → []) */
  csv: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    ),
  /** "true"/"1"/"yes" → true, "false"/"0"/"no"/unset → false */
  flag: z
    .enum(['true', 'false', '1', '0', 'yes', 'no'])
    .optional()
    .transform((value) => value === 'true' || value === '1' || value === 'yes'),
  /** Required secret with a minimum length — never give secrets a default */
  secret: (minLength = 16) => z.string().min(minLength, `must be at least ${minLength} characters`),
};
