import { Request, Response } from 'express';
import { ApiResponse, AppError, paginateCursor, paginateOffset } from '@restful/shared';
import prisma from '../lib/prisma';
import { Prisma } from '../../generated/prisma';
import { CreateProductInput, ListProductsQuery, ProductFeedQuery, SORT_FIELDS } from '../validators/product.schema';

/** Turns validated filters into a Prisma `where`; every filter is optional and combined with AND. */
export const buildWhere = (query: Omit<ListProductsQuery, 'page' | 'pageSize' | 'sort'>): Prisma.ProductWhereInput => ({
  ...(query.category && { category: query.category }),
  ...(query.q && { name: { contains: query.q, mode: 'insensitive' } }),
  ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
    priceCents: { gte: query.minPrice, lte: query.maxPrice },
  }),
});

/** "-price" → [{ priceCents: 'desc' }, { id: 'desc' }]; `id` breaks ties so pages never overlap. */
export const buildOrderBy = (sort: string): Prisma.ProductOrderByWithRelationInput[] => {
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = SORT_FIELDS[sort.replace(/^-/, '') as keyof typeof SORT_FIELDS];
  return [{ [field]: direction }, { id: direction }];
};

// Feed cursor = "<createdAt ISO>|<id>": the position of the last row seen (keyset pagination)
const toCursor = (product: { createdAt: Date; id: string }) => `${product.createdAt.toISOString()}|${product.id}`;

const afterCursor = (cursor: string): Prisma.ProductWhereInput => {
  const [createdAt, id] = cursor.split('|');
  const at = new Date(createdAt);
  if (!id || Number.isNaN(at.getTime())) {
    throw new AppError('Invalid cursor', 400);
  }
  // Rows strictly after the cursor in (createdAt desc, id desc) order
  return { OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }] };
};

export class ProductController {
  /** GET /api/products — offset pagination + filters + sort (supports "jump to page N") */
  static async list(req: Request, res: Response) {
    const { page, pageSize, sort, ...filters } = req.query as unknown as ListProductsQuery;
    const where = buildWhere(filters);

    const result = await paginateOffset({ page, pageSize }, ({ skip, take }) =>
      prisma.$transaction([
        prisma.product.findMany({ where, orderBy: buildOrderBy(sort), skip, take }),
        prisma.product.count({ where }),
      ]),
    );
    ApiResponse.success(res, result, 'Products fetched successfully');
  }

  /** GET /api/products/feed — cursor pagination, newest first (stable while rows are added) */
  static async feed(req: Request, res: Response) {
    const { cursor, limit, category } = req.query as unknown as ProductFeedQuery;

    const result = await paginateCursor(
      { cursor, limit },
      ({ after, take }) =>
        prisma.product.findMany({
          where: { ...(category && { category }), ...(after && afterCursor(after)) },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take,
        }),
      toCursor,
    );
    ApiResponse.success(res, result, 'Products fetched successfully');
  }

  static async create(req: Request, res: Response) {
    const product = await prisma.product.create({ data: req.body as CreateProductInput });
    ApiResponse.success(res, product, 'Product created successfully', 201);
  }
}
