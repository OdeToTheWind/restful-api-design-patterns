import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { upload } from '../utils/upload';

const router = Router();

// Single file upload
router.post('/single', upload.single('file'), UploadController.uploadFile);

// Multiple files upload (max 5)
router.post('/multiple', upload.array('files', 5), UploadController.uploadMultiple);

export default router;