import { Router } from 'express';
import { asyncHandler, validateBody } from '@restful/shared';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, loginAccountLimiter } from '../middleware/rate-limit.middleware';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validators/auth.schema';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(AuthController.register));
router.post('/login', authLimiter, validateBody(loginSchema), loginAccountLimiter, asyncHandler(AuthController.login));
router.post('/refresh', authLimiter, validateBody(refreshTokenSchema), asyncHandler(AuthController.refresh));
router.post('/logout', validateBody(refreshTokenSchema), asyncHandler(AuthController.logout));

// Protected Route Example — req.user is typed by @restful/shared
router.get('/me', authenticate, AuthController.me);

export default router;
