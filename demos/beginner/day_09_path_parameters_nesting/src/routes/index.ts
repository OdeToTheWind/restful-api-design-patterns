import { Router } from 'express';
import postRoutes from './post.routes';

const router = Router();

// Nested Routes: /api/users/:userId/posts
router.use('/users/:userId/posts', postRoutes);

export default router;