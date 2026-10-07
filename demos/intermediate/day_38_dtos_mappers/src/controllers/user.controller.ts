import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse, AppError, AuthUser } from '@restful/shared';
import prisma from '../lib/prisma';
import { config } from '../config';
import type { LoginDto, RegisterDto, UpdateNotesDto, UpdateProfileDto } from '../dtos/user.dto';
import { toAdminUser, toPrivateUser, toPublicUser, toUserCreateData } from '../mappers/user.mapper';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

/** Controllers always return a mapped DTO — never a Prisma row. */
export class UserController {
  static async register(req: Request, res: Response) {
    const dto = req.body as RegisterDto;
    const user = await prisma.user.create({ data: toUserCreateData(dto, await bcrypt.hash(dto.password, 10)) });
    ApiResponse.success(res, toPrivateUser(user), 'User registered successfully', 201);
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginDto;
    const found = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!found || !passwordMatches) throw new AppError('Invalid credentials', 401);

    const user = await prisma.user.update({ where: { id: found.id }, data: { lastLoginAt: new Date() } });
    const payload: AuthUser = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenTtlSeconds });
    ApiResponse.success(res, { token, user: toPrivateUser(user) }, 'Login successful');
  }

  /** Anyone: the public view only */
  static async getPublic(req: Request, res: Response) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
    ApiResponse.success(res, toPublicUser(user), 'User fetched successfully');
  }

  /** The signed-in user: their own private view */
  static async me(req: Request, res: Response) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    ApiResponse.success(res, toPrivateUser(user), 'Profile fetched successfully');
  }

  static async updateMe(req: Request, res: Response) {
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: req.body as UpdateProfileDto });
    ApiResponse.success(res, toPrivateUser(user), 'Profile updated successfully');
  }

  /** Admins: the full admin view (still no password hash) */
  static async adminList(req: Request, res: Response) {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    ApiResponse.success(res, users.map(toAdminUser), 'Users fetched successfully');
  }

  static async adminUpdateNotes(req: Request, res: Response) {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body as UpdateNotesDto });
    ApiResponse.success(res, toAdminUser(user), 'Notes updated successfully');
  }
}
