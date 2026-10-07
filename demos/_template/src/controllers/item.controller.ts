import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { CreateItemInput, UpdateItemInput } from '../validators/item.schema';

// req.body is already validated by validateBody(); thrown errors and rejected promises
// reach errorHandler via asyncHandler (Prisma P2002 → 409, P2025 → 404)
export class ItemController {
  static async getAll(req: Request, res: Response) {
    const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });
    ApiResponse.success(res, items, 'Items fetched successfully');
  }

  static async create(req: Request, res: Response) {
    const item = await prisma.item.create({ data: req.body as CreateItemInput });
    ApiResponse.success(res, item, 'Item created successfully', 201);
  }

  static async update(req: Request, res: Response) {
    const item = await prisma.item.update({ where: { id: req.params.id }, data: req.body as UpdateItemInput });
    ApiResponse.success(res, item, 'Item updated successfully');
  }

  static async delete(req: Request, res: Response) {
    await prisma.item.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, null, 'Item deleted successfully');
  }
}
