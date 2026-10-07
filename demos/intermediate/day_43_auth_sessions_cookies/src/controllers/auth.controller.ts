import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ApiResponse, AppError } from '@restful/shared';
import prisma from '../lib/prisma';
import { config } from '../config';
import { clearSessionCookies, REFRESH_COOKIE, setSessionCookies } from '../lib/cookies';
import {
  ClientInfo,
  DEFAULT_ROLE,
  endSessionByToken,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  rotateSession,
  startSession,
} from '../services/session.service';
import { LoginInput, RegisterInput } from '../validators/auth.schema';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);
const publicUser = { id: true, name: true, email: true, createdAt: true } as const;
const clientInfo = (req: Request): ClientInfo => ({ userAgent: req.get('user-agent'), ip: req.ip });

export class AuthController {
  static async register(req: Request, res: Response) {
    const { name, email, password } = req.body as RegisterInput;
    const user = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 10) },
      select: publicUser,
    });
    ApiResponse.success(res, user, 'User registered successfully', 201);
  }

  /** The refresh token goes into an httpOnly cookie — it never appears in the response body. */
  static async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) throw new AppError('Invalid credentials', 401);

    const session = await startSession({ id: user.id, email: user.email, role: DEFAULT_ROLE }, clientInfo(req));
    setSessionCookies(res, session.refreshToken, session.csrfToken);
    ApiResponse.success(
      res,
      {
        user: { id: user.id, name: user.name, email: user.email },
        token: session.accessToken,
        expiresIn: config.accessTokenTtlSeconds,
      },
      'Login successful',
    );
  }

  static async refresh(req: Request, res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (typeof presented !== 'string') throw new AppError('No session', 401);

    try {
      const session = await rotateSession(presented, clientInfo(req));
      setSessionCookies(res, session.refreshToken, session.csrfToken);
      ApiResponse.success(
        res,
        { token: session.accessToken, expiresIn: config.accessTokenTtlSeconds },
        'Token refreshed',
      );
    } catch (error) {
      clearSessionCookies(res); // a dead session's cookies are useless — remove them
      throw error;
    }
  }

  static async logout(req: Request, res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (typeof presented === 'string') await endSessionByToken(presented);
    clearSessionCookies(res);
    ApiResponse.success(res, null, 'Logged out');
  }

  static me(req: Request, res: Response) {
    ApiResponse.success(res, req.user, 'Current user');
  }

  static async sessions(req: Request, res: Response) {
    ApiResponse.success(res, await listSessions(req.user!.id, res.locals.sessionId), 'Active sessions');
  }

  static async revokeSession(req: Request, res: Response) {
    await revokeSession(req.user!.id, req.params.id);
    ApiResponse.success(res, null, 'Session revoked');
  }

  static async revokeOthers(req: Request, res: Response) {
    const revoked = await revokeOtherSessions(req.user!.id, res.locals.sessionId);
    ApiResponse.success(res, { revoked }, 'Other sessions revoked');
  }
}
