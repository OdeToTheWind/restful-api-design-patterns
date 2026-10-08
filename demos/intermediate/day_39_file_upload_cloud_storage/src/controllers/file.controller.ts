import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { ApiResponse, AppError, logger } from '@restful/shared';
import prisma from '../lib/prisma';
import { deleteObject, inspectObject, presignDownload, presignUpload } from '../lib/storage';
import { config } from '../config';
import { CreateUploadInput } from '../validators/file.schema';

export class FileController {
  /** Step 1: validate the declared file, record it as PENDING, hand out an upload URL. */
  static async createUpload(req: Request, res: Response) {
    const { filename, contentType, sizeBytes } = req.body as CreateUploadInput;
    // A random key: user input never decides where objects are stored
    const key = `uploads/${randomUUID()}`;
    const file = await prisma.file.create({ data: { key, filename, contentType, sizeBytes } });
    const url = await presignUpload(key, contentType);

    ApiResponse.success(
      res,
      {
        file,
        upload: { method: 'PUT', url, headers: { 'Content-Type': contentType }, expiresIn: config.uploadUrlTtlSeconds },
      },
      'Upload URL created',
      201,
    );
  }

  /**
   * Step 3 (after the client PUT the bytes): check what was really stored. The client can lie
   * about size and type when asking for the URL, so the object itself is the source of truth.
   */
  static async completeUpload(req: Request, res: Response) {
    const file = await prisma.file.findUniqueOrThrow({ where: { id: req.params.id } });
    if (file.status === 'READY') return ApiResponse.success(res, file, 'Upload already completed');

    const stored = await inspectObject(file.key);
    if (!stored) throw new AppError('Nothing has been uploaded for this file yet', 409);

    if (
      stored.size !== file.sizeBytes ||
      stored.size > config.maxUploadBytes ||
      stored.contentType !== file.contentType
    ) {
      logger.warn('Rejected upload that does not match its declaration', {
        fileId: file.id,
        declared: file.sizeBytes,
        stored,
      });
      await deleteObject(file.key);
      await prisma.file.delete({ where: { id: file.id } });
      throw new AppError('Uploaded file does not match the declared size or type', 422);
    }

    const ready = await prisma.file.update({
      where: { id: file.id },
      data: { status: 'READY', uploadedAt: new Date() },
    });
    ApiResponse.success(res, ready, 'Upload completed');
  }

  static async list(_req: Request, res: Response) {
    const files = await prisma.file.findMany({ where: { status: 'READY' }, orderBy: { uploadedAt: 'desc' } });
    ApiResponse.success(res, files, 'Files fetched');
  }

  static async download(req: Request, res: Response) {
    const file = await prisma.file.findUniqueOrThrow({ where: { id: req.params.id } });
    if (file.status !== 'READY') throw new AppError('File is not available yet', 409);
    const url = await presignDownload(file.key, file.filename);
    ApiResponse.success(res, { url, expiresIn: config.downloadUrlTtlSeconds }, 'Download URL created');
  }

  static async remove(req: Request, res: Response) {
    const file = await prisma.file.findUniqueOrThrow({ where: { id: req.params.id } });
    await deleteObject(file.key); // idempotent in S3: deleting a missing key succeeds
    await prisma.file.delete({ where: { id: file.id } });
    ApiResponse.success(res, null, 'File deleted');
  }

  /**
   * Periodic or on-demand cleanup: removes PENDING uploads whose pre-signed URL has expired,
   * deleting any orphaned object in storage and removing the DB record.
   */
  static async cleanupAbandoned(_req: Request, res: Response) {
    const cutoff = new Date(Date.now() - config.uploadUrlTtlSeconds * 1000);
    const abandoned = await prisma.file.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
    });

    const cleanedIds: string[] = [];
    for (const file of abandoned) {
      await deleteObject(file.key);
      await prisma.file.delete({ where: { id: file.id } });
      cleanedIds.push(file.id);
    }

    logger.info('Cleaned up abandoned file uploads', { count: cleanedIds.length, cleanedIds });
    ApiResponse.success(res, { cleanedCount: cleanedIds.length, cleanedIds }, 'Abandoned uploads cleaned up');
  }
}
