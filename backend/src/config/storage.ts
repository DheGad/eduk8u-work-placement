import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { logger } from './logger';
import { StorageUploadResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// ============================================================
// Allowed file types and size limits
// ============================================================

/** MIME types permitted for upload */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

/** Maximum upload size: 20 MB */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// ============================================================
// S3 client (Vultr Object Storage)
// ============================================================

const s3Client = new S3Client({
  region: env.VULTR_REGION,
  endpoint: env.VULTR_ENDPOINT,
  credentials: {
    accessKeyId: env.VULTR_ACCESS_KEY,
    secretAccessKey: env.VULTR_SECRET_KEY,
  },
  forcePathStyle: true, // required for Vultr/MinIO-compatible endpoints
});

// ============================================================
// Storage helpers
// ============================================================

/**
 * Validate file before upload.
 * Throws descriptive errors on constraint violations.
 */
function validateFile(mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `File type '${mimeType}' is not permitted. Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`
    );
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${(sizeBytes / 1024 / 1024).toFixed(2)} MB exceeds the maximum allowed size of 20 MB`
    );
  }
}

/**
 * Build a deterministic storage key for an upload.
 * Format: {tenantId}/{category}/{YYYY/MM}/{uuid}{ext}
 */
function buildStorageKey(
  tenantId: string,
  category: string,
  originalFilename: string
): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const now = new Date();
  const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${tenantId}/${category}/${datePath}/${uuidv4()}${ext}`;
}

/**
 * Upload a file buffer to Vultr Object Storage.
 *
 * @param buffer - Raw file bytes
 * @param originalFilename - Original filename (used for extension)
 * @param mimeType - MIME type of the file
 * @param tenantId - Tenant identifier (used in key prefix)
 * @param category - Logical category (e.g. 'documents', 'evidence')
 * @returns StorageUploadResult containing the key, public URL, and metadata
 */
export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  tenantId: string,
  category: string
): Promise<StorageUploadResult> {
  validateFile(mimeType, buffer.byteLength);

  const key = buildStorageKey(tenantId, category, originalFilename);

  const command = new PutObjectCommand({
    Bucket: env.VULTR_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ContentLength: buffer.byteLength,
    Metadata: {
      tenantId,
      category,
      originalFilename,
      uploadedAt: new Date().toISOString(),
    },
  });

  try {
    await s3Client.send(command);
    const url = `${env.VULTR_ENDPOINT}/${env.VULTR_BUCKET_NAME}/${key}`;
    logger.info('File uploaded to object storage', { key, size: buffer.byteLength, mimeType });

    return {
      key,
      url,
      bucket: env.VULTR_BUCKET_NAME,
      size: buffer.byteLength,
      mimeType,
    };
  } catch (error) {
    logger.error('Object storage upload failed', {
      key,
      error: (error as Error).message,
    });
    throw new Error(`Failed to upload file to object storage: ${(error as Error).message}`);
  }
}

/**
 * Generate a pre-signed download URL for a private object.
 * The URL expires after 1 hour by default.
 *
 * @param key - Storage key returned by uploadFile
 * @param expiresInSeconds - Expiry duration (default: 3600s)
 * @returns Pre-signed HTTPS URL
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.VULTR_BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    logger.error('Failed to generate signed URL', { key, error: (error as Error).message });
    throw new Error(`Failed to generate download URL: ${(error as Error).message}`);
  }
}

/**
 * Permanently delete an object from storage.
 *
 * @param key - Storage key of the object to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.VULTR_BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    logger.info('File deleted from object storage', { key });
  } catch (error) {
    logger.error('Object storage delete failed', { key, error: (error as Error).message });
    throw new Error(`Failed to delete file from storage: ${(error as Error).message}`);
  }
}

/**
 * List objects in the bucket under a given prefix.
 *
 * @param prefix - Key prefix to filter by (e.g. '{tenantId}/documents/')
 * @param maxKeys - Maximum number of results (default: 100)
 * @returns Array of { key, size, lastModified } objects
 */
export async function listFiles(
  prefix: string,
  maxKeys = 100
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const command = new ListObjectsV2Command({
    Bucket: env.VULTR_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  try {
    const response: ListObjectsV2CommandOutput = await s3Client.send(command);
    return (response.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
    }));
  } catch (error) {
    logger.error('Object storage list failed', { prefix, error: (error as Error).message });
    throw new Error(`Failed to list files: ${(error as Error).message}`);
  }
}
