import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';

const author = { select: { name: true, email: true } } as const;

export class PostController {
  /** Published posts only, newest first — drafts from the seed never leak */
  static async list(req: Request, res: Response) {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      include: { author },
    });
    ApiResponse.success(res, posts, 'Posts fetched successfully');
  }

  static async get(req: Request, res: Response) {
    const post = await prisma.post.findFirstOrThrow({
      where: { slug: req.params.slug, published: true },
      include: { author },
    });
    ApiResponse.success(res, post, 'Post fetched successfully');
  }

  static async authors(req: Request, res: Response) {
    const authors = await prisma.author.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: { where: { published: true } } } } },
    });
    ApiResponse.success(res, authors, 'Authors fetched successfully');
  }
}
