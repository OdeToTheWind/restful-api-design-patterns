import { Router } from 'express';
import { asyncHandler, validateBody } from '@restful/shared';
import { ItemController } from '../controllers/item.controller';
import { createItemSchema, updateItemSchema } from '../validators/item.schema';

const router = Router();

router.get('/', asyncHandler(ItemController.getAll));
router.post('/', validateBody(createItemSchema), asyncHandler(ItemController.create));
router.put('/:id', validateBody(updateItemSchema), asyncHandler(ItemController.update));
router.delete('/:id', asyncHandler(ItemController.delete));

export default router;
