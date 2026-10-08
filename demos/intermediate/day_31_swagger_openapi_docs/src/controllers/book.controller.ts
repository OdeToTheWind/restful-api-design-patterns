import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { CreateBookInput, UpdateBookInput } from '../contract/books.contract';

// Bodies and params are validated against the contract before these run.
// Prisma errors: duplicate ISBN (P2002) → 409, missing record (P2025) → 404.
export class BookController {
  static async list(req: Request, res: Response) {
    const books = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
    ApiResponse.success(res, books, 'Books fetched successfully');
  }

  static async get(req: Request, res: Response) {
    const book = await prisma.book.findUniqueOrThrow({ where: { id: req.params.id } });
    ApiResponse.success(res, book, 'Book fetched successfully');
  }

  static async create(req: Request, res: Response) {
    const book = await prisma.book.create({ data: req.body as CreateBookInput });
    ApiResponse.success(res, book, 'Book created successfully', 201);
  }

  static async update(req: Request, res: Response) {
    const book = await prisma.book.update({ where: { id: req.params.id }, data: req.body as UpdateBookInput });
    ApiResponse.success(res, book, 'Book updated successfully');
  }

  static async delete(req: Request, res: Response) {
    await prisma.book.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, null, 'Book deleted successfully');
  }
}
