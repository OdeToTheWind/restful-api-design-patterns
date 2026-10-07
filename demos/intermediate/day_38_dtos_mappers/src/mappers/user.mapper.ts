import type { Prisma, User } from '../../generated/prisma';
import type { AdminUserDto, PrivateUserDto, PublicUserDto, RegisterDto } from '../dtos/user.dto';

/**
 * Mappers build every DTO field by field — never `{ ...user }` and never "delete user.password".
 * A new column added to the User table therefore stays private until someone decides,
 * in one place, which view may expose it.
 */
export const toPublicUser = (user: User): PublicUserDto => ({
  id: user.id,
  displayName: user.displayName,
  bio: user.bio,
  memberSince: user.createdAt.toISOString().slice(0, 10),
});

export const toPrivateUser = (user: User): PrivateUserDto => ({
  ...toPublicUser(user),
  email: user.email,
  role: user.role,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
});

export const toAdminUser = (user: User): AdminUserDto => ({
  ...toPrivateUser(user),
  internalNotes: user.internalNotes,
  updatedAt: user.updatedAt.toISOString(),
});

/** Input mapping: the client's DTO → what gets stored. Role and notes can never come from here. */
export const toUserCreateData = (dto: RegisterDto, passwordHash: string): Prisma.UserCreateInput => ({
  email: dto.email,
  displayName: dto.displayName,
  passwordHash,
});
