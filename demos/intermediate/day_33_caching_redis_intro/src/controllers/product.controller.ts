import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { bumpListVersion, cached, invalidate, listVersion } from '../lib/cache';
import { CreateProductInput, UpdateProductInput } from '../validators/product.schema';

const NAMESPACE = 'products';
const itemKey = (id: string) => `${NAMESPACE}:${id}`;

export class ProductController {
  static async list(req: Request, res: Response) {
    const version = await listVersion(NAMESPACE);
    const { value, status } = await cached(`${NAMESPACE}:list:v${version}`, () =>
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    );
    res.setHeader('X-Cache', status);
    ApiResponse.success(res, value, 'Products fetched successfully');
  }

  static async get(req: Request, res: Response) {
    const { value, status } = await cached(itemKey(req.params.id), () =>
      prisma.product.findUniqueOrThrow({ where: { id: req.params.id } }),
    );
    res.setHeader('X-Cache', status);
    ApiResponse.success(res, value, 'Product fetched successfully');
  }

  static async create(req: Request, res: Response) {
    const product = await prisma.product.create({ data: req.body as CreateProductInput });
    await bumpListVersion(NAMESPACE);
    ApiResponse.success(res, product, 'Product created successfully', 201);
  }

  // Write to the database first, then invalidate — never the other way round, or a concurrent
  // read could re-cache the old row between the delete and the write.
  static async update(req: Request, res: Response) {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body as UpdateProductInput });
    await Promise.all([invalidate(itemKey(product.id)), bumpListVersion(NAMESPACE)]);
    ApiResponse.success(res, product, 'Product updated successfully');
  }

  static async delete(req: Request, res: Response) {
    await prisma.product.delete({ where: { id: req.params.id } });
    await Promise.all([invalidate(itemKey(req.params.id)), bumpListVersion(NAMESPACE)]);
    ApiResponse.success(res, null, 'Product deleted successfully');
  }
}
