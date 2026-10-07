import { Router } from 'express';
import { asyncHandler, validateBody } from '@restful/shared';
import { UserController, createUserSchema, updateUserSchema } from '../controllers/user.controller';

const router = Router();

router.get('/', asyncHandler(UserController.getAll));
router.post('/', validateBody(createUserSchema), asyncHandler(UserController.create));
router.put('/:id', validateBody(updateUserSchema), asyncHandler(UserController.update));
router.delete('/:id', asyncHandler(UserController.delete));

export default router;
