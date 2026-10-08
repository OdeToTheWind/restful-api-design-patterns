import { Router } from 'express';
import { asyncHandler, validateBody, validateQuery } from '@restful/shared';
import { ProductController } from '../controllers/product.controller';
import { createProductSchema, listProductsQuery, productFeedQuery } from '../validators/product.schema';

const router = Router();

router.get('/', validateQuery(listProductsQuery), asyncHandler(ProductController.list));
router.get('/feed', validateQuery(productFeedQuery), asyncHandler(ProductController.feed));
router.post('/', validateBody(createProductSchema), asyncHandler(ProductController.create));

export default router;
