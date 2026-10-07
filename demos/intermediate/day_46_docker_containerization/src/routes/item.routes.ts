import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { ItemController } from '../controllers/item.controller';
import { createItemSchema, itemIdParamsSchema, updateItemSchema } from '../validators/item.schema';

const router = Router();
const validId = validateParams(itemIdParamsSchema);

router.get('/', asyncHandler(ItemController.getAll));
router.post('/', validateBody(createItemSchema), asyncHandler(ItemController.create));
router.put('/:id', validId, validateBody(updateItemSchema), asyncHandler(ItemController.update));
router.delete('/:id', validId, asyncHandler(ItemController.delete));

export default router;
