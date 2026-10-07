import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';

const router = Router();

router.get('/', AssetController.getAllAssets);
router.delete('/:filename', AssetController.deleteAsset);

export default router;