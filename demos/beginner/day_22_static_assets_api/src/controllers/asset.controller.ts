import { Request, Response } from 'express';
import { ApiResponse } from '../utils/response.util';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export class AssetController {
  static getAllAssets(req: Request, res: Response) {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(UPLOADS_DIR).map(filename => ({
      filename,
      url: `/uploads/${filename}`,
      size: fs.statSync(path.join(UPLOADS_DIR, filename)).size,
      uploadedAt: fs.statSync(path.join(UPLOADS_DIR, filename)).mtime
    }));

    ApiResponse.success(res, files, "Assets retrieved successfully");
  }

  static deleteAsset(req: Request, res: Response) {
    // Post-snapshot fix (#36): prevent path traversal by sanitizing filename and restricting to uploads/
    const { filename } = req.params;
    const safeFilename = path.basename(filename || '');
    const uploadsRoot = path.resolve(UPLOADS_DIR);
    const targetPath = path.resolve(uploadsRoot, safeFilename);

    if (!safeFilename || safeFilename === '.' || safeFilename === '..' || !targetPath.startsWith(uploadsRoot + path.sep)) {
      ApiResponse.error(res, "Invalid file path", 400);
      return;
    }

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      ApiResponse.success(res, { filename: safeFilename }, "Asset deleted successfully");
    } else {
      ApiResponse.error(res, "File not found", 404);
    }
  }
}