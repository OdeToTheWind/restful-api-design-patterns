import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { ArticleController } from '../controllers/article.controller';
import { TrashController } from '../controllers/trash.controller';
import {
  articleIdParamsSchema,
  articleSlugParamsSchema,
  createArticleSchema,
  updateArticleSchema,
} from '../validators/article.schema';

const router = Router();
const validId = validateParams(articleIdParamsSchema);

// Trash routes first, so /articles/trash isn't read as a slug
router.get('/articles/trash', asyncHandler(TrashController.list));
router.post('/articles/:id/restore', validId, asyncHandler(TrashController.restore));
router.delete('/articles/:id/permanent', validId, asyncHandler(TrashController.purge));

router.get('/articles', asyncHandler(ArticleController.list));
router.post('/articles', validateBody(createArticleSchema), asyncHandler(ArticleController.create));
router.get('/articles/:slug', validateParams(articleSlugParamsSchema), asyncHandler(ArticleController.get));
router.patch('/articles/:id', validId, validateBody(updateArticleSchema), asyncHandler(ArticleController.update));
router.delete('/articles/:id', validId, asyncHandler(ArticleController.remove));

export default router;
