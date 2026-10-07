import { Router } from 'express';
import { TodoController } from '../controllers/todo.controller';

const router = Router();

router.get('/', TodoController.getAll);
router.post('/', TodoController.create);
router.put('/:id', TodoController.update);
router.delete('/:id', TodoController.delete);

export default router;