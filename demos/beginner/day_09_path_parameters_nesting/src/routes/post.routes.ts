import { Router } from 'express';
import { PostController } from '../controllers/post.controller';

const router = Router({ mergeParams: true });

router.get('/', PostController.getUserPosts);
router.get('/:postId', PostController.getPostById);
router.post('/', PostController.createPost);

export default router;