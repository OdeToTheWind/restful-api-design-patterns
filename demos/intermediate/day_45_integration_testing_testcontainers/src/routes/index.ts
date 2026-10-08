import { Router } from 'express';
import { asyncHandler, validateBody, validateParams, validateQuery } from '@restful/shared';
import { BookmarkController } from '../controllers/bookmark.controller';
import { bookmarkIdParamsSchema, createBookmarkSchema, listBookmarksQuery } from '../validators/bookmark.schema';

const router = Router();

router.get('/bookmarks', validateQuery(listBookmarksQuery), asyncHandler(BookmarkController.list));
router.post('/bookmarks', validateBody(createBookmarkSchema), asyncHandler(BookmarkController.create));
router.delete('/bookmarks/:id', validateParams(bookmarkIdParamsSchema), asyncHandler(BookmarkController.delete));

export default router;
