import { Router } from 'express';
import { asyncHandler } from '@restful/shared';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/rbac.middleware';

const router = Router();

// Every user's email is personal data — staff only, not every logged-in user
router.get('/', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), asyncHandler(UserController.getAllUsers));
router.get('/admin', authenticate, authorizeRoles('ADMIN'), asyncHandler(UserController.getAdminDashboard));

export default router;
