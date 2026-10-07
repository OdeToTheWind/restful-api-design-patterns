import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { BookController } from '../controllers/book.controller';
import { bookIdParamsSchema, createBookSchema, updateBookSchema } from '../contract/books.contract';

const router = Router();
const validId = validateParams(bookIdParamsSchema);

router.get('/', asyncHandler(BookController.list));
router.post('/', validateBody(createBookSchema), asyncHandler(BookController.create));
router.get('/:id', validId, asyncHandler(BookController.get));
router.patch('/:id', validId, validateBody(updateBookSchema), asyncHandler(BookController.update));
router.delete('/:id', validId, asyncHandler(BookController.delete));

export default router;
