import { Storage } from '@google-cloud/storage';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

let storage: Storage;

function getStorage(): Storage {
  if (!storage) {
    if (env.gcs.serviceAccountJson) {
      let credentials: object;
      try {
        credentials = JSON.parse(env.gcs.serviceAccountJson);
      } catch {
        throw new Error('GCS_SERVICE_ACCOUNT_JSON is not valid JSON');
      }
      storage = new Storage({ credentials });
    } else {
      // Falls back to Application Default Credentials (ADC)
      storage = new Storage({ projectId: env.gcs.projectId });
    }
  }
  return storage;
}

export interface UploadResult {
  storageUrl: string;
  storagePath: string;
}

export async function uploadFileToBucket(
  buffer: Buffer,
  originalName: string,
  userId: string,
  contentType = 'application/pdf'
): Promise<UploadResult> {
  const ext = path.extname(originalName).toLowerCase();
  const fileName = `${uuidv4()}${ext}`;
  const storagePath = `documents/${userId}/${fileName}`;

  try {
    const bucket = getStorage().bucket(env.gcs.bucketName);
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedBy: userId,
          originalName,
        },
      },
    });

    // Make the file publicly readable (for signed URL approach, skip this and use signedUrl)
    await file.makePublic();

    const storageUrl = `https://storage.googleapis.com/${env.gcs.bucketName}/${storagePath}`;
    logger.debug(`File uploaded to GCS: ${storagePath}`);

    return { storageUrl, storagePath };
  } catch (error) {
    logger.error('GCS upload error:', error);
    throw new Error(`Failed to upload file to storage: ${(error as Error).message}`);
  }
}

export async function deleteFileFromBucket(storagePath: string): Promise<void> {
  try {
    const bucket = getStorage().bucket(env.gcs.bucketName);
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    logger.debug(`File deleted from GCS: ${storagePath}`);
  } catch (error) {
    logger.warn(`Failed to delete file from GCS (${storagePath}):`, error);
  }
}

export async function getSignedUrl(storagePath: string, expiresInMs = 3600000): Promise<string> {
  const options = {
    version: 'v4' as const,
    action: 'read' as const,
    expires: Date.now() + expiresInMs,
  };

  const [url] = await getStorage()
    .bucket(env.gcs.bucketName)
    .file(storagePath)
    .getSignedUrl(options);

  return url;
}
