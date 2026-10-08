import { z } from 'zod';
import { config } from '../config';

export const createUploadSchema = z.object({
  // Path separators and control characters are removed; the stored key never uses it directly
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    // Control characters are exactly what this strips, so the rule is disabled on purpose
    // eslint-disable-next-line no-control-regex
    .transform((name) => name.replace(/[/\\\x00-\x1f]/g, '_')),
  contentType: z.enum(config.allowedContentTypes),
  sizeBytes: z.number().int().min(1).max(config.maxUploadBytes, `must be at most ${config.maxUploadBytes} bytes`),
});

export const fileIdParamsSchema = z.object({ id: z.string().cuid() });
export type CreateUploadInput = z.infer<typeof createUploadSchema>;
