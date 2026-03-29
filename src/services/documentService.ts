import mongoose from 'mongoose';
import { DocumentModel, IDocument } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { uploadFileToBucket, deleteFileFromBucket } from '../integrations/googleStorage';
import { extractTextFromPdf } from '../utils/pdfProcessor';
import { chunkText } from '../utils/textChunker';
import { computeFileHash } from '../utils/hash';
import {
  calculateProcessingCost,
  deductCredits,
  refundCredits,
} from './creditService';
import { InsufficientCreditsError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export async function uploadDocument(
  userId: string,
  fileBuffer: Buffer,
  originalName: string,
  fileSizeBytes: number
): Promise<IDocument> {
  const fileHash = computeFileHash(fileBuffer);

  // Check for duplicate within user's documents
  const existing = await DocumentModel.findOne({ userId, fileHash, status: { $ne: 'failed' } });
  if (existing) {
    throw new Error(
      `This document was already uploaded. See "${existing.name}" in your library.`
    );
  }

  // Upload to GCS first (before charging credits - will refund on failure)
  const { storageUrl, storagePath } = await uploadFileToBucket(
    fileBuffer,
    originalName,
    userId
  );

  // Create document record with 'uploaded' status
  const document = await DocumentModel.create({
    userId,
    name: originalName.replace(/\.pdf$/i, ''),
    originalName,
    size: fileSizeBytes,
    fileHash,
    storageUrl,
    storagePath,
    status: 'uploaded',
  });

  logger.info(`Document uploaded: ${document._id} by user ${userId}`);
  return document;
}

export async function processDocument(
  documentId: string,
  userId: string
): Promise<IDocument> {
  const document = await DocumentModel.findById(documentId);

  if (!document) throw new NotFoundError('Document');
  if (document.userId.toString() !== userId) throw new ForbiddenError();

  if (document.status === 'processed') {
    throw new Error('Document is already processed.');
  }

  if (document.status === 'processing') {
    throw new Error('Document is currently being processed.');
  }

  // Mark as processing
  document.status = 'processing';
  await document.save();

  let creditsDeducted = false;
  let creditsUsed = 0;

  try {
    // We need to fetch the PDF to process it. For now we'll use the file buffer
    // that was stored during upload. In production, download from GCS.
    // Since we don't store the buffer, we'd download it from GCS.
    // For this implementation, we'll use a placeholder approach.
    // The actual PDF text extraction needs the buffer.
    throw new Error(
      'Document processing must be called via the upload endpoint that retains the buffer. Use processDocumentWithBuffer instead.'
    );
  } catch (error) {
    document.status = 'failed';
    document.errorMessage = (error as Error).message;
    await document.save();

    if (creditsDeducted && creditsUsed > 0) {
      await refundCredits(
        userId,
        creditsUsed,
        'document_processing_refund',
        `Refund for failed processing of "${document.name}"`,
        document._id
      );
    }

    throw error;
  }
}

export async function processDocumentWithBuffer(
  documentId: string,
  userId: string,
  fileBuffer: Buffer
): Promise<IDocument> {
  const document = await DocumentModel.findById(documentId);

  if (!document) throw new NotFoundError('Document');
  if (document.userId.toString() !== userId) throw new ForbiddenError();

  // Mark as processing
  document.status = 'processing';
  await document.save();

  let creditsDeducted = false;
  let creditsUsed = 0;

  try {
    // Extract text from PDF
    const extracted = await extractTextFromPdf(fileBuffer);
    const pageCount = extracted.pageCount;

    // Calculate and deduct processing credits
    creditsUsed = calculateProcessingCost(pageCount);

    const user = await User.findById(userId);
    if (!user || user.credits < creditsUsed) {
      throw new InsufficientCreditsError(creditsUsed, user?.credits ?? 0);
    }

    await deductCredits(
      userId,
      creditsUsed,
      'document_processing',
      `Processing "${document.name}" (${pageCount} pages)`,
      document._id,
      'Document'
    );
    creditsDeducted = true;

    // Chunk the text
    const chunks = chunkText(extracted.text, { maxChunkSize: 3000, overlapSize: 200 });

    // Delete existing chunks if reprocessing
    await DocumentChunk.deleteMany({ documentId: document._id });

    // Save chunks
    if (chunks.length > 0) {
      await DocumentChunk.insertMany(
        chunks.map((chunk) => ({
          documentId: document._id,
          userId,
          index: chunk.index,
          text: chunk.text,
          tokenEstimate: chunk.tokenEstimate,
          charStart: chunk.charStart,
          charEnd: chunk.charEnd,
        }))
      );
    }

    // Update document
    document.status = 'processed';
    document.pageCount = pageCount;
    document.textLength = extracted.text.length;
    document.chunkCount = chunks.length;
    document.processingCreditsUsed = creditsUsed;
    await document.save();

    logger.info(
      `Document processed: ${documentId}, pages=${pageCount}, chunks=${chunks.length}`
    );
    return document;
  } catch (error) {
    document.status = 'failed';
    document.errorMessage = (error as Error).message;
    await document.save();

    if (creditsDeducted && creditsUsed > 0) {
      await refundCredits(
        userId,
        creditsUsed,
        'document_processing_refund',
        `Refund for failed processing of "${document.name}"`,
        document._id
      );
    }

    logger.error(`Document processing failed: ${documentId}`, error);
    throw error;
  }
}

export async function getUserDocuments(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    DocumentModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    DocumentModel.countDocuments({ userId }),
  ]);

  return {
    documents,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getDocumentById(documentId: string, userId: string): Promise<IDocument> {
  const document = await DocumentModel.findById(documentId);
  if (!document) throw new NotFoundError('Document');
  if (document.userId.toString() !== userId) throw new ForbiddenError();
  return document;
}

export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const document = await DocumentModel.findById(documentId);
  if (!document) throw new NotFoundError('Document');
  if (document.userId.toString() !== userId) throw new ForbiddenError();

  // Delete GCS file
  await deleteFileFromBucket(document.storagePath);

  // Delete chunks
  await DocumentChunk.deleteMany({ documentId: document._id });

  // Delete document record
  await DocumentModel.deleteOne({ _id: documentId });

  logger.info(`Document deleted: ${documentId} by user ${userId}`);
}

export async function getDocumentChunks(documentId: string, userId: string) {
  const document = await DocumentModel.findById(documentId);
  if (!document) throw new NotFoundError('Document');
  if (document.userId.toString() !== userId) throw new ForbiddenError();

  return DocumentChunk.find({ documentId }).sort({ index: 1 }).lean();
}
