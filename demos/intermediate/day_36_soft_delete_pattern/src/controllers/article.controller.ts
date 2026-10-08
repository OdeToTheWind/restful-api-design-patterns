import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { CreateArticleInput, UpdateArticleInput } from '../validators/article.schema';

/** Written as if soft delete didn't exist — the Prisma extension handles it. */
export class ArticleController {
  static async list(_req: Request, res: Response) {
    ApiResponse.success(res, await prisma.article.findMany({ orderBy: { createdAt: 'desc' } }), 'Articles fetched');
  }

  static async get(req: Request, res: Response) {
    const article = await prisma.article.findFirstOrThrow({ where: { slug: req.params.slug } });
    ApiResponse.success(res, article, 'Article fetched');
  }

  static async create(req: Request, res: Response) {
    ApiResponse.success(
      res,
      await prisma.article.create({ data: req.body as CreateArticleInput }),
      'Article created',
      201,
    );
  }

  static async update(req: Request, res: Response) {
    const article = await prisma.article.update({ where: { id: req.params.id }, data: req.body as UpdateArticleInput });
    ApiResponse.success(res, article, 'Article updated');
  }

  /** Moves the article to the trash (the extension turns delete into an update) */
  static async remove(req: Request, res: Response) {
    const article = await prisma.article.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, article, 'Article moved to trash');
  }
}
