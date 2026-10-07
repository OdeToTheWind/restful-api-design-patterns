import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';

export class UploadController {
  static uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return ApiResponse.error(res, "No file uploaded", 400);
    }

    ApiResponse.success(res, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype
    }, "File uploaded successfully", 201);
  }

  static uploadMultiple(req: Request, res: Response) {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return ApiResponse.error(res, "No files uploaded", 400);
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: `/uploads/${file.filename}`
    }));

    ApiResponse.success(res, files, `${files.length} files uploaded successfully`, 201);
  }
}