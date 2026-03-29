import { Request, Response } from 'express';
import multer from 'multer';
import { IUser } from '../models/User';
import {
  uploadDocument,
  processDocumentWithBuffer,
  getUserDocuments,
  getDocumentById,
  deleteDocument,
  getDocumentChunks,
} from '../services/documentService';
import { sendSuccess, sendCreated, sendBadRequest } from '../utils/apiResponse';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Multer config: memory storage
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.upload.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export async function uploadAndProcessDocument(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.user as IUser;

  if (!req.file) {
    sendBadRequest(res, 'No PDF file provided');
    return;
  }

  const { buffer, originalname, size } = req.file;

  // Step 1: Upload to GCS and create record
  const document = await uploadDocument(
    user._id.toString(),
    buffer,
    originalname,
    size
  );

  // Step 2: Process in background (or inline for MVP)
  // For MVP, process synchronously inline
  try {
    const processed = await processDocumentWithBuffer(
      document._id.toString(),
      user._id.toString(),
      buffer
    );
    sendCreated(res, processed, 'Document uploaded and processed successfully');
  } catch (processingError) {
    // Upload succeeded but processing failed - return the uploaded doc with failed status
    logger.warn(`Document upload ok but processing failed: ${document._id}`, processingError);
    sendCreated(res, document, `Document uploaded but processing failed: ${(processingError as Error).message}`);
  }
}

export async function listDocuments(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserDocuments(user._id.toString(), page, limit);
  sendSuccess(res, result.documents, undefined, 200, { pagination: result.pagination });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const document = await getDocumentById(id, user._id.toString());
  sendSuccess(res, document);
}

export async function removeDocument(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  await deleteDocument(id, user._id.toString());
  sendSuccess(res, null, 'Document deleted');
}

export async function getChunks(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const chunks = await getDocumentChunks(id, user._id.toString());
  sendSuccess(res, chunks);
}

// Handle multer errors
export function handleMulterError(
  err: Error,
  req: Request,
  res: Response,
  next: Function
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendBadRequest(res, `File too large. Maximum size is ${env.upload.maxFileSizeMb}MB.`);
      return;
    }
    sendBadRequest(res, err.message);
    return;
  }
  if (err.message === 'Only PDF files are allowed') {
    sendBadRequest(res, err.message);
    return;
  }
  next(err);
}
