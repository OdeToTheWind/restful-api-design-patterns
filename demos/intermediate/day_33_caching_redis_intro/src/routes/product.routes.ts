import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { ProductController } from '../controllers/product.controller';
import { createProductSchema, productIdParamsSchema, updateProductSchema } from '../validators/product.schema';

const router = Router();
const validId = validateParams(productIdParamsSchema);

router.get('/', asyncHandler(ProductController.list));
router.post('/', validateBody(createProductSchema), asyncHandler(ProductController.create));
router.get('/:id', validId, asyncHandler(ProductController.get));
router.patch('/:id', validId, validateBody(updateProductSchema), asyncHandler(ProductController.update));
router.delete('/:id', validId, asyncHandler(ProductController.delete));

export default router;
