import { Router } from 'express';
import { asyncHandler, validateParams } from '@restful/shared';
import { PostController } from '../controllers/post.controller';
import { postSlugParamsSchema } from '../validators/post.schema';

const router = Router();

router.get('/posts', asyncHandler(PostController.list));
router.get('/posts/:slug', validateParams(postSlugParamsSchema), asyncHandler(PostController.get));
router.get('/authors', asyncHandler(PostController.authors));

export default router;
