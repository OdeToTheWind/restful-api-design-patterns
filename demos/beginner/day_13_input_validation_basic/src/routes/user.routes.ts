import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema } from '../validators/user.validator';

const router = Router();

router.post('/', validate(createUserSchema), UserController.createUser);

export default router;