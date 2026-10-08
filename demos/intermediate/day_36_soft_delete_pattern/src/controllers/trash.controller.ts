import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import { prismaWithDeleted } from '../lib/prisma';

// Uses the unfiltered client on purpose: the trash is the one place that sees deleted rows
const inTrash = (id: string) => ({ id, deletedAt: { not: null } });

export class TrashController {
  static async list(_req: Request, res: Response) {
    const articles = await prismaWithDeleted.article.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    ApiResponse.success(res, articles, 'Trash fetched');
  }

  /** Restoring fails with 409 if another active article took the slug meanwhile (partial unique index) */
  static async restore(req: Request, res: Response) {
    const article = await prismaWithDeleted.article.update({
      where: inTrash(req.params.id),
      data: { deletedAt: null },
    });
    ApiResponse.success(res, article, 'Article restored');
  }

  /** Permanent deletion — only for articles already in the trash */
  static async purge(req: Request, res: Response) {
    await prismaWithDeleted.article.delete({ where: inTrash(req.params.id) });
    ApiResponse.success(res, null, 'Article permanently deleted');
  }
}
