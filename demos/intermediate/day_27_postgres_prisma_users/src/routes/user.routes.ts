import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { UserController, createUserSchema, updateUserSchema, userIdParamsSchema } from '../controllers/user.controller';

const router = Router();
const validId = validateParams(userIdParamsSchema);

router.get('/', asyncHandler(UserController.getAll));
router.post('/', validateBody(createUserSchema), asyncHandler(UserController.create));
router.put('/:id', validId, validateBody(updateUserSchema), asyncHandler(UserController.update));
router.delete('/:id', validId, asyncHandler(UserController.delete));

export default router;
