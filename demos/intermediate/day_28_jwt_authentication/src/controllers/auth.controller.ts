import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ApiResponse, AppError } from '@restful/shared';
import prisma from '../lib/prisma';
import { issueTokens, revokeRefreshToken, rotateRefreshToken } from '../services/token.service';
import { LoginInput, RefreshTokenInput, RegisterInput } from '../validators/auth.schema';

// Compared against when the email is unknown, so both failure paths cost one bcrypt
// comparison and response time doesn't reveal which emails are registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

const publicUserFields = { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } as const;

// req.body has already been validated by validateBody(); errors are forwarded by asyncHandler
export class AuthController {
  /**
   * POST /api/auth/register
   * Public — registers a new user. Role is ALWAYS defaulted to USER by the Prisma schema.
   */
  static async register(req: Request, res: Response) {
    const { name, email, password } = req.body as RegisterInput;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: publicUserFields,
    });

    ApiResponse.success(res, user, 'User registered successfully', 201);
  }

  /**
   * POST /api/auth/login
   * Public — validates credentials and returns a signed JWT.
   */
  static async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });

    const { password: _password, ...userWithoutPassword } = user;
    ApiResponse.success(res, { user: userWithoutPassword, ...tokens }, 'Login successful');
  }

  /**
   * POST /api/auth/refresh
   * Public — exchanges a refresh token for a new token pair (the old refresh token is revoked).
   */
  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await rotateRefreshToken(refreshToken);
    ApiResponse.success(res, tokens, 'Token refreshed');
  }

  /**
   * POST /api/auth/logout
   * Public — revokes the given refresh token. The access token simply expires (max 15 min).
   */
  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshTokenInput;
    await revokeRefreshToken(refreshToken);
    ApiResponse.success(res, null, 'Logged out');
  }

  /**
   * GET /api/auth/me
   * Protected — returns the user decoded from the JWT.
   */
  static me(req: Request, res: Response) {
    ApiResponse.success(res, req.user, 'Current user');
  }
}
