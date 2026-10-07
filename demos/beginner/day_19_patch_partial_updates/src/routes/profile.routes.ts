import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';

const router = Router();

router.get('/:id', ProfileController.getProfile);
router.patch('/:id', ProfileController.updateProfile);   // PATCH for partial update

export default router;