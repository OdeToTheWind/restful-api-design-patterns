import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { loginDto, registerDto, updateNotesDto, updateProfileDto, userIdParamsDto } from '../dtos/user.dto';

const router = Router();

router.post('/auth/register', validateBody(registerDto), asyncHandler(UserController.register));
router.post('/auth/login', validateBody(loginDto), asyncHandler(UserController.login));

router.get('/me', authenticate, asyncHandler(UserController.me));
router.patch('/me', authenticate, validateBody(updateProfileDto), asyncHandler(UserController.updateMe));

router.get('/users/:id', validateParams(userIdParamsDto), asyncHandler(UserController.getPublic));

router.get('/admin/users', authenticate, requireAdmin, asyncHandler(UserController.adminList));
router.patch(
  '/admin/users/:id/notes',
  authenticate,
  requireAdmin,
  validateParams(userIdParamsDto),
  validateBody(updateNotesDto),
  asyncHandler(UserController.adminUpdateNotes),
);

export default router;
