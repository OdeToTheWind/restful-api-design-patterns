import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { FileController } from '../controllers/file.controller';
import { createUploadSchema, fileIdParamsSchema } from '../validators/file.schema';

const router = Router();
const validId = validateParams(fileIdParamsSchema);

router.get('/files', asyncHandler(FileController.list));
router.post('/files', validateBody(createUploadSchema), asyncHandler(FileController.createUpload));
router.post('/files/cleanup-abandoned', asyncHandler(FileController.cleanupAbandoned));
router.post('/files/:id/complete', validId, asyncHandler(FileController.completeUpload));
router.get('/files/:id/download', validId, asyncHandler(FileController.download));
router.delete('/files/:id', validId, asyncHandler(FileController.remove));

export default router;
