"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = uploadDocument;
exports.processDocument = processDocument;
exports.processDocumentWithBuffer = processDocumentWithBuffer;
exports.getUserDocuments = getUserDocuments;
exports.getDocumentById = getDocumentById;
exports.deleteDocument = deleteDocument;
exports.getDocumentChunks = getDocumentChunks;
const Document_1 = require("../models/Document");
const DocumentChunk_1 = require("../models/DocumentChunk");
const googleStorage_1 = require("../integrations/googleStorage");
const pdfProcessor_1 = require("../utils/pdfProcessor");
const textChunker_1 = require("../utils/textChunker");
const hash_1 = require("../utils/hash");
const creditService_1 = require("./creditService");
const errorHandler_1 = require("../middlewares/errorHandler");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
async function uploadDocument(userId, fileBuffer, originalName, fileSizeBytes) {
    const fileHash = (0, hash_1.computeFileHash)(fileBuffer);
    // Check for duplicate within user's documents
    const existing = await Document_1.DocumentModel.findOne({ userId, fileHash, status: { $ne: 'failed' } });
    if (existing) {
        throw new Error(`This document was already uploaded. See "${existing.name}" in your library.`);
    }
    // Upload to GCS first (before charging credits - will refund on failure)
    const { storageUrl, storagePath } = await (0, googleStorage_1.uploadFileToBucket)(fileBuffer, originalName, userId);
    // Create document record with 'uploaded' status
    const document = await Document_1.DocumentModel.create({
        userId,
        name: originalName.replace(/\.pdf$/i, ''),
        originalName,
        size: fileSizeBytes,
        fileHash,
        storageUrl,
        storagePath,
        status: 'uploaded',
    });
    logger_1.logger.info(`Document uploaded: ${document._id} by user ${userId}`);
    return document;
}
async function processDocument(documentId, userId) {
    const document = await Document_1.DocumentModel.findById(documentId);
    if (!document)
        throw new errorHandler_1.NotFoundError('Document');
    if (document.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
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
        throw new Error('Document processing must be called via the upload endpoint that retains the buffer. Use processDocumentWithBuffer instead.');
    }
    catch (error) {
        document.status = 'failed';
        document.errorMessage = error.message;
        await document.save();
        if (creditsDeducted && creditsUsed > 0) {
            await (0, creditService_1.refundCredits)(userId, creditsUsed, 'document_processing_refund', `Refund for failed processing of "${document.name}"`, document._id);
        }
        throw error;
    }
}
async function processDocumentWithBuffer(documentId, userId, fileBuffer) {
    const document = await Document_1.DocumentModel.findById(documentId);
    if (!document)
        throw new errorHandler_1.NotFoundError('Document');
    if (document.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    // Mark as processing
    document.status = 'processing';
    await document.save();
    let creditsDeducted = false;
    let creditsUsed = 0;
    try {
        // Extract text from PDF
        const extracted = await (0, pdfProcessor_1.extractTextFromPdf)(fileBuffer);
        const pageCount = extracted.pageCount;
        // Calculate and deduct processing credits
        creditsUsed = (0, creditService_1.calculateProcessingCost)(pageCount);
        const user = await User_1.User.findById(userId);
        if (!user || user.credits < creditsUsed) {
            throw new errorHandler_1.InsufficientCreditsError(creditsUsed, user?.credits ?? 0);
        }
        await (0, creditService_1.deductCredits)(userId, creditsUsed, 'document_processing', `Processing "${document.name}" (${pageCount} pages)`, document._id, 'Document');
        creditsDeducted = true;
        // Chunk the text
        const chunks = (0, textChunker_1.chunkText)(extracted.text, { maxChunkSize: 3000, overlapSize: 200 });
        // Delete existing chunks if reprocessing
        await DocumentChunk_1.DocumentChunk.deleteMany({ documentId: document._id });
        // Save chunks
        if (chunks.length > 0) {
            await DocumentChunk_1.DocumentChunk.insertMany(chunks.map((chunk) => ({
                documentId: document._id,
                userId,
                index: chunk.index,
                text: chunk.text,
                tokenEstimate: chunk.tokenEstimate,
                charStart: chunk.charStart,
                charEnd: chunk.charEnd,
            })));
        }
        // Update document
        document.status = 'processed';
        document.pageCount = pageCount;
        document.textLength = extracted.text.length;
        document.chunkCount = chunks.length;
        document.processingCreditsUsed = creditsUsed;
        await document.save();
        logger_1.logger.info(`Document processed: ${documentId}, pages=${pageCount}, chunks=${chunks.length}`);
        return document;
    }
    catch (error) {
        document.status = 'failed';
        document.errorMessage = error.message;
        await document.save();
        if (creditsDeducted && creditsUsed > 0) {
            await (0, creditService_1.refundCredits)(userId, creditsUsed, 'document_processing_refund', `Refund for failed processing of "${document.name}"`, document._id);
        }
        logger_1.logger.error(`Document processing failed: ${documentId}`, error);
        throw error;
    }
}
async function getUserDocuments(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
        Document_1.DocumentModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Document_1.DocumentModel.countDocuments({ userId }),
    ]);
    return {
        documents,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function getDocumentById(documentId, userId) {
    const document = await Document_1.DocumentModel.findById(documentId);
    if (!document)
        throw new errorHandler_1.NotFoundError('Document');
    if (document.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    return document;
}
async function deleteDocument(documentId, userId) {
    const document = await Document_1.DocumentModel.findById(documentId);
    if (!document)
        throw new errorHandler_1.NotFoundError('Document');
    if (document.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    // Delete GCS file
    await (0, googleStorage_1.deleteFileFromBucket)(document.storagePath);
    // Delete chunks
    await DocumentChunk_1.DocumentChunk.deleteMany({ documentId: document._id });
    // Delete document record
    await Document_1.DocumentModel.deleteOne({ _id: documentId });
    logger_1.logger.info(`Document deleted: ${documentId} by user ${userId}`);
}
async function getDocumentChunks(documentId, userId) {
    const document = await Document_1.DocumentModel.findById(documentId);
    if (!document)
        throw new errorHandler_1.NotFoundError('Document');
    if (document.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    return DocumentChunk_1.DocumentChunk.find({ documentId }).sort({ index: 1 }).lean();
}
//# sourceMappingURL=documentService.js.map