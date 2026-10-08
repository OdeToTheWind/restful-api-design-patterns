import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { CreateBookmarkInput, ListBookmarksQuery } from '../validators/bookmark.schema';

export class BookmarkController {
  static async list(req: Request, res: Response) {
    const { tag } = req.query as unknown as ListBookmarksQuery;
    const bookmarks = await prisma.bookmark.findMany({
      // `hasEvery` compiles to the Postgres array operator @> (served by the GIN index)
      where: tag.length ? { tags: { hasEvery: tag } } : {},
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    ApiResponse.success(res, bookmarks, 'Bookmarks fetched successfully');
  }

  static async create(req: Request, res: Response) {
    const bookmark = await prisma.bookmark.create({ data: req.body as CreateBookmarkInput });
    ApiResponse.success(res, bookmark, 'Bookmark created successfully', 201);
  }

  static async delete(req: Request, res: Response) {
    await prisma.bookmark.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, null, 'Bookmark deleted successfully');
  }
}
