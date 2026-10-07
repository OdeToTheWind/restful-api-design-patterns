import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    ApiResponse.success(res, users, 'All users fetched successfully');
  }

  static async getAdminDashboard(req: Request, res: Response) {
    const totalUsers = await prisma.user.count();
    ApiResponse.success(
      res,
      {
        message: 'Welcome to Admin Dashboard',
        stats: { totalUsers },
      },
      'Admin data accessed',
    );
  }
}
