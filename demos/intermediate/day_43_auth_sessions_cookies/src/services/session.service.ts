import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { AppError, AuthUser } from '@restful/shared';
import { Prisma } from '../../generated/prisma';
import prisma from '../lib/prisma';
import { config } from '../config';

const DAY_MS = 24 * 60 * 60 * 1000;

// This demo has no roles; the shared AuthUser shape still carries one
export const DEFAULT_ROLE = 'USER';

export interface ClientInfo {
  userAgent?: string;
  ip?: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  sessionId: string;
}

export interface SessionView {
  id: string;
  userAgent: string | null;
  ip: string | null;
  startedAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  current: boolean;
}

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
const randomToken = () => randomBytes(32).toString('base64url');

/** Access tokens carry the session id (`sid`) so a request knows which session it belongs to. */
const signAccessToken = (user: AuthUser, sessionId: string): string =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, sid: sessionId }, config.jwtSecret, {
    expiresIn: config.accessTokenTtlSeconds,
  });

const storeRefreshToken = async (
  db: Prisma.TransactionClient,
  args: { userId: string; sessionId: string; sessionStartedAt: Date; client: ClientInfo },
) => {
  const refreshToken = randomToken();
  const row = await db.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: args.userId,
      sessionId: args.sessionId,
      sessionStartedAt: args.sessionStartedAt,
      userAgent: args.client.userAgent?.slice(0, 200) ?? null,
      ip: args.client.ip ?? null,
      expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS),
    },
  });
  return { refreshToken, id: row.id };
};

/** Login: a brand-new session with its first refresh token. */
export const startSession = async (user: AuthUser, client: ClientInfo): Promise<IssuedSession> => {
  const sessionId = randomUUID();
  const { refreshToken } = await storeRefreshToken(prisma, {
    userId: user.id,
    sessionId,
    sessionStartedAt: new Date(),
    client,
  });
  return { accessToken: signAccessToken(user, sessionId), refreshToken, csrfToken: randomToken(), sessionId };
};

/** Refresh: rotate the token within the same session. Reusing a rotated token revokes everything. */
export const rotateSession = async (presented: string, client: ClientInfo): Promise<IssuedSession> => {
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(presented) },
    include: { user: true },
  });
  if (!existing) throw new AppError('Invalid refresh token', 401);

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError('Refresh token reuse detected; all sessions have been revoked', 401);
  }
  if (existing.expiresAt <= new Date()) throw new AppError('Session expired', 401);

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) throw new AppError('Invalid refresh token', 401);

    const next = await storeRefreshToken(tx, {
      userId: existing.userId,
      sessionId: existing.sessionId,
      sessionStartedAt: existing.sessionStartedAt,
      client,
    });
    await tx.refreshToken.update({ where: { id: existing.id }, data: { replacedById: next.id } });

    const { user } = existing;
    return {
      accessToken: signAccessToken({ id: user.id, email: user.email, role: DEFAULT_ROLE }, existing.sessionId),
      refreshToken: next.refreshToken,
      csrfToken: randomToken(),
      sessionId: existing.sessionId,
    };
  });
};

/** Logout: ends the session the presented refresh token belongs to. Idempotent. */
export const endSessionByToken = async (presented: string): Promise<void> => {
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(presented) } });
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { sessionId: token.sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/** Active sessions of a user — one row per session (its current, unrevoked token). */
export const listSessions = async (userId: string, currentSessionId?: string): Promise<SessionView[]> => {
  const active = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  return active.map((token) => ({
    id: token.sessionId,
    userAgent: token.userAgent,
    ip: token.ip,
    startedAt: token.sessionStartedAt,
    lastUsedAt: token.createdAt,
    expiresAt: token.expiresAt,
    current: token.sessionId === currentSessionId,
  }));
};

/** "Sign out that device". Only the owner's own, still-active sessions can be revoked. */
export const revokeSession = async (userId: string, sessionId: string): Promise<void> => {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new AppError('Session not found', 404);
};

/** "Sign out everywhere else". */
export const revokeOtherSessions = async (userId: string, keepSessionId?: string): Promise<number> => {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null, ...(keepSessionId && { NOT: { sessionId: keepSessionId } }) },
    data: { revokedAt: new Date() },
  });
  return count;
};
