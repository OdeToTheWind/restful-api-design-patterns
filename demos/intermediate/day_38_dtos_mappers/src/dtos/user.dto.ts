import { z } from 'zod';

/**
 * Output DTOs: the exact shapes the API returns. Each view is a strict superset of the one
 * before it, and none of them can contain `passwordHash` — it simply isn't a field here.
 */
export const publicUserDto = z.object({
  id: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  memberSince: z.string().date().describe('Join date (day precision only)'),
});

export const privateUserDto = publicUserDto.extend({
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']),
  lastLoginAt: z.string().datetime().nullable(),
});

export const adminUserDto = privateUserDto.extend({
  internalNotes: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export type PublicUserDto = z.infer<typeof publicUserDto>;
export type PrivateUserDto = z.infer<typeof privateUserDto>;
export type AdminUserDto = z.infer<typeof adminUserDto>;

/** Input DTOs: what clients may send. Validated, then mapped to persistence data. */
export const registerDto = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(1).max(60),
});

export const loginDto = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

export const updateProfileDto = z
  .object({ displayName: z.string().trim().min(1).max(60), bio: z.string().trim().max(280).nullable() })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

export const updateNotesDto = z.object({ internalNotes: z.string().trim().max(2000).nullable() });
export const userIdParamsDto = z.object({ id: z.string().cuid() });

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
export type UpdateNotesDto = z.infer<typeof updateNotesDto>;
