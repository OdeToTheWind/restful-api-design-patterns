import { Router } from 'express';
import { asyncHandler, validateBody } from '@restful/shared';
import { TodoController, createTodoSchema, updateTodoSchema } from '../controllers/todo.controller';

const router = Router();

router.get('/', asyncHandler(TodoController.getAll));
router.post('/', validateBody(createTodoSchema), asyncHandler(TodoController.create));
router.put('/:id', validateBody(updateTodoSchema), asyncHandler(TodoController.update));
router.delete('/:id', asyncHandler(TodoController.delete));

export default router;
