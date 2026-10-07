import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { TodoController, createTodoSchema, todoIdParamsSchema, updateTodoSchema } from '../controllers/todo.controller';

const router = Router();
const validId = validateParams(todoIdParamsSchema);

router.get('/', asyncHandler(TodoController.getAll));
router.post('/', validateBody(createTodoSchema), asyncHandler(TodoController.create));
router.put('/:id', validId, validateBody(updateTodoSchema), asyncHandler(TodoController.update));
router.delete('/:id', validId, asyncHandler(TodoController.delete));

export default router;
