import { z } from 'zod';

export const postSlugParamsSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,120}$/, 'Invalid slug') });
