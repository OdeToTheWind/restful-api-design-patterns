import { Router } from 'express';
import { PostController } from '../controllers/post.controller';

const router = Router();

router.get('/', PostController.getAllPosts);
router.get('/:id', PostController.getPostById);
router.post('/', PostController.createPost);
router.put('/:id', PostController.updatePost);
router.patch('/:id', PostController.partialUpdatePost);
router.delete('/:id', PostController.deletePost);

export default router;