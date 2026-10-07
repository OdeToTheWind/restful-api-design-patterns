import { Router } from 'express';
import postRoutes from './post.routes';

const router = Router();

// Nested Route: /api/posts/:postId/comments
router.use('/posts/:postId/comments', postRoutes);

export default router;