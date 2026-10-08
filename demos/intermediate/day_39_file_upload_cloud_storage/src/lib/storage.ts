import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

// One client per process. Local S3-compatible servers need path-style URLs (http://host/bucket/key).
export const s3 = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  forcePathStyle: Boolean(config.s3.endpoint),
  credentials: { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey },
  // Recent SDK versions add a CRC32 checksum to every request by default. For a pre-signed
  // PUT that checksum is computed over an EMPTY body and baked into the URL, so every real
  // upload would fail the check. Only add checksums where the operation requires them.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const Bucket = config.s3.bucket;

/** A URL the client can PUT the file to directly — the bytes never pass through this API. */
export const presignUpload = (key: string, contentType: string) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }), {
    expiresIn: config.uploadUrlTtlSeconds,
  });

/** A short-lived download URL that also tells the browser the original file name. */
export const presignDownload = (key: string, filename: string) =>
  getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
    }),
    { expiresIn: config.downloadUrlTtlSeconds },
  );

/** What is actually stored — or null if nothing was uploaded under that key. */
export const inspectObject = async (key: string): Promise<{ size: number; contentType?: string } | null> => {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType };
  } catch (error) {
    if ((error as { name?: string }).name === 'NotFound') return null;
    throw error;
  }
};

export const deleteObject = (key: string) => s3.send(new DeleteObjectCommand({ Bucket, Key: key }));

export const ensureBucket = async (): Promise<void> => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket }));
  }
};
