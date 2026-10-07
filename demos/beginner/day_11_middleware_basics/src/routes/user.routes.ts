import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateCreateUser } from '../middleware/validate.middleware';

const router = Router();

router.get('/', UserController.getAllUsers);
router.post('/', validateCreateUser, UserController.createUser);

export default router;