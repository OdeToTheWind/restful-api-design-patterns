import { Router } from 'express';
import { z } from 'zod';
import { ApiResponse, AppError, docsRouter, logger, validateParams } from '@restful/shared';
import { catalog, Product } from '../catalog/catalog';
import type { AppConfig } from '../config';
import { v1Document } from './v1.docs';

export const productIdParams = z.object({ id: z.string().regex(/^p-\d+$/) });

/** v1 representation: flat price in cents, no pagination */
export const toV1 = (product: Product) => ({
  id: product.id,
  name: product.name,
  priceCents: product.priceCents,
  currency: product.currency,
});

export const v1Router = ({ v1 }: AppConfig, now: () => Date = () => new Date()): Router => {
  const router = Router();
  router.use(docsRouter(v1Document, '/docs'));

  /**
   * Deprecation signalling (RFC 9745 Deprecation, RFC 8594 Sunset, RFC 8288 Link):
   * clients and their tooling can see — on every response — that v1 is going away, when,
   * and where to go instead. After the sunset date v1 answers 410 Gone.
   */
  router.use((req, res, next) => {
    res.setHeader('Deprecation', `@${Math.floor(v1.deprecatedAt.getTime() / 1000)}`);
    res.setHeader('Sunset', v1.sunsetAt.toUTCString());
    res.setHeader('Link', '</api/v2/products>; rel="successor-version", </api/v1/docs>; rel="deprecation"');
    // Knowing who still calls v1 is what makes a safe shutdown possible
    logger.warn('deprecated API version used', {
      version: 'v1',
      path: req.originalUrl,
      userAgent: req.get('user-agent'),
    });

    if (now() >= v1.sunsetAt) return next(new AppError('API v1 was retired; use /api/v2', 410));
    next();
  });

  router.get('/products', (_req, res) => {
    ApiResponse.success(res, catalog.all().map(toV1), 'Products fetched');
  });

  router.get('/products/:id', validateParams(productIdParams), (req, res, next) => {
    const product = catalog.byId(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    ApiResponse.success(res, toV1(product), 'Product fetched');
  });

  return router;
};
