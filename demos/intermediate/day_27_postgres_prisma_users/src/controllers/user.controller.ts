import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';

// Whitelist of client-settable fields. `role` is deliberately absent:
// unknown keys are stripped by validateBody, so clients cannot grant themselves ADMIN.
export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  age: z.number().int().min(0).max(150).optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Prisma errors (P2002 duplicate email, P2025 not found) are mapped to 409/404 by errorHandler
export class UserController {
  static async getAll(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    ApiResponse.success(res, users, "Users fetched successfully");
  }

  static async create(req: Request, res: Response) {
    const user = await prisma.user.create({ data: req.body });
    ApiResponse.success(res, user, "User created successfully", 201);
  }

  static async update(req: Request, res: Response) {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body
    });

    ApiResponse.success(res, user, "User updated successfully");
  }

  static async delete(req: Request, res: Response) {
    await prisma.user.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, null, "User deleted successfully");
  }
}
