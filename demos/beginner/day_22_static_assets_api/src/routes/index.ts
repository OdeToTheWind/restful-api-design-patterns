import { Router } from 'express';
import assetRoutes from './asset.routes';

const router = Router();
router.use('/assets', assetRoutes);

export default router;
