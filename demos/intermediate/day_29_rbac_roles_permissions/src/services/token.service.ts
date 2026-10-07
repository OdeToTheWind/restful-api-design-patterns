import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AppError, AuthUser } from '@restful/shared';
import { Prisma } from '../../generated/prisma';
import prisma from '../lib/prisma';
import { config } from '../config';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TokenPair {
  /** Short-lived JWT for the Authorization header */
  token: string;
  /** Long-lived opaque token, exchanged at POST /api/auth/refresh */
  refreshToken: string;
  /** Access token lifetime in seconds */
  expiresIn: number;
}

/** Only this hash is stored, so a database leak doesn't hand out usable refresh tokens. */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const signAccessToken = (user: AuthUser): string => {
  const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenTtlSeconds });
};

const createRefreshToken = async (userId: string, db: Prisma.TransactionClient = prisma) => {
  const token = randomBytes(48).toString('base64url');
  const record = await db.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS) },
  });
  return { token, id: record.id };
};

/** Login: a fresh access token + refresh token pair. */
export const issueTokens = async (user: AuthUser): Promise<TokenPair> => {
  const { token: refreshToken } = await createRefreshToken(user.id);
  return { token: signAccessToken(user), refreshToken, expiresIn: config.accessTokenTtlSeconds };
};

/**
 * Exchanges a refresh token for a new pair and revokes the old one (rotation).
 * The role is re-read from the database, so role changes apply at the next refresh.
 */
export const rotateRefreshToken = async (presented: string): Promise<TokenPair> => {
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presented) },
    include: { user: true },
  });

  if (!existing) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (existing.revokedAt) {
    // A rotated-away token used again means it leaked: revoke every session of this user
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token reuse detected; all sessions have been revoked', 401);
  }

  if (existing.expiresAt <= new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  const { user } = existing;

  return prisma.$transaction(async (tx) => {
    // Conditional revoke: if a parallel request already rotated this token, nothing matches
    const { count } = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) {
      throw new AppError('Invalid refresh token', 401);
    }

    const next = await createRefreshToken(user.id, tx);
    await tx.refreshToken.update({ where: { id: existing.id }, data: { replacedById: next.id } });

    return { token: signAccessToken(user), refreshToken: next.token, expiresIn: config.accessTokenTtlSeconds };
  });
};

/** Logout: revokes the presented refresh token. Idempotent — unknown tokens are ignored. */
export const revokeRefreshToken = async (presented: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(presented), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
