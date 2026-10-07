import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);
router.get('/error', UserController.simulateServerError);

export default router;