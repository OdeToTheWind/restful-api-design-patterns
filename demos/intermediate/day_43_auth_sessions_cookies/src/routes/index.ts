import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authLimiter, requireCsrf } from '../middleware/auth.middleware';
import { loginSchema, registerSchema, sessionIdParamsSchema } from '../validators/auth.schema';

const router = Router();

router.post('/auth/register', authLimiter, validateBody(registerSchema), asyncHandler(AuthController.register));
router.post('/auth/login', authLimiter, validateBody(loginSchema), asyncHandler(AuthController.login));

// Cookie-authenticated: these need the CSRF header
router.post('/auth/refresh', authLimiter, requireCsrf, asyncHandler(AuthController.refresh));
router.post('/auth/logout', requireCsrf, asyncHandler(AuthController.logout));

// Bearer-authenticated
router.get('/auth/me', authenticate, AuthController.me);
router.get('/auth/sessions', authenticate, asyncHandler(AuthController.sessions));
router.delete('/auth/sessions', authenticate, asyncHandler(AuthController.revokeOthers));
router.delete(
  '/auth/sessions/:id',
  authenticate,
  validateParams(sessionIdParamsSchema),
  asyncHandler(AuthController.revokeSession),
);

export default router;
