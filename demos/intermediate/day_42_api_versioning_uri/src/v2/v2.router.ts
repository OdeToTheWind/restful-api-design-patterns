import { Router } from 'express';
import { z } from 'zod';
import {
  ApiResponse,
  AppError,
  docsRouter,
  offsetPaginationQuery,
  paginateOffset,
  validateParams,
  validateQuery,
} from '@restful/shared';
import { catalog, Product } from '../catalog/catalog';
import { productIdParams } from '../v1/v1.router';
import { v2Document } from './v2.docs';

export const listQueryV2 = offsetPaginationQuery.extend({ tag: z.string().trim().toLowerCase().max(30).optional() });

/**
 * v2 representation — the breaking changes that justified a new version:
 * - price is an object with a decimal string amount (no more client-side cents maths)
 * - tags are exposed
 * - lists are paginated ({ items, meta } instead of a bare array)
 */
export const toV2 = (product: Product) => ({
  id: product.id,
  name: product.name,
  price: { amount: (product.priceCents / 100).toFixed(2), currency: product.currency },
  tags: product.tags,
});

export const v2Router = (): Router => {
  const router = Router();
  router.use(docsRouter(v2Document, '/docs'));

  router.get('/products', validateQuery(listQueryV2), async (req, res, next) => {
    try {
      const { page, pageSize, tag } = req.query as unknown as z.infer<typeof listQueryV2>;
      const matching = catalog.all().filter((product) => !tag || product.tags.includes(tag));
      const result = await paginateOffset({ page, pageSize }, async ({ skip, take }) => [
        matching.slice(skip, skip + take).map(toV2),
        matching.length,
      ]);
      ApiResponse.success(res, result, 'Products fetched');
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id', validateParams(productIdParams), (req, res, next) => {
    const product = catalog.byId(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    ApiResponse.success(res, toV2(product), 'Product fetched');
  });

  return router;
};
