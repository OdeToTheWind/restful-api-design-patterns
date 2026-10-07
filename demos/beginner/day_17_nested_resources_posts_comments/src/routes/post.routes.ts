import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';

const router = Router({ mergeParams: true });

router.get('/', CommentController.getPostComments);
router.post('/', CommentController.addComment);

export default router;