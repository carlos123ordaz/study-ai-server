"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
exports.uploadAndProcessDocument = uploadAndProcessDocument;
exports.listDocuments = listDocuments;
exports.getDocument = getDocument;
exports.removeDocument = removeDocument;
exports.getChunks = getChunks;
exports.handleMulterError = handleMulterError;
const multer_1 = __importDefault(require("multer"));
const documentService_1 = require("../services/documentService");
const apiResponse_1 = require("../utils/apiResponse");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Multer config: memory storage
exports.uploadMiddleware = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: env_1.env.upload.maxFileSizeMb * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});
async function uploadAndProcessDocument(req, res) {
    const user = req.user;
    if (!req.file) {
        (0, apiResponse_1.sendBadRequest)(res, 'No PDF file provided');
        return;
    }
    const { buffer, originalname, size } = req.file;
    // Step 1: Upload to GCS and create record
    const document = await (0, documentService_1.uploadDocument)(user._id.toString(), buffer, originalname, size);
    // Step 2: Process in background (or inline for MVP)
    // For MVP, process synchronously inline
    try {
        const processed = await (0, documentService_1.processDocumentWithBuffer)(document._id.toString(), user._id.toString(), buffer);
        (0, apiResponse_1.sendCreated)(res, processed, 'Document uploaded and processed successfully');
    }
    catch (processingError) {
        // Upload succeeded but processing failed - return the uploaded doc with failed status
        logger_1.logger.warn(`Document upload ok but processing failed: ${document._id}`, processingError);
        (0, apiResponse_1.sendCreated)(res, document, `Document uploaded but processing failed: ${processingError.message}`);
    }
}
async function listDocuments(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await (0, documentService_1.getUserDocuments)(user._id.toString(), page, limit);
    (0, apiResponse_1.sendSuccess)(res, result.documents, undefined, 200, { pagination: result.pagination });
}
async function getDocument(req, res) {
    const user = req.user;
    const { id } = req.params;
    const document = await (0, documentService_1.getDocumentById)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, document);
}
async function removeDocument(req, res) {
    const user = req.user;
    const { id } = req.params;
    await (0, documentService_1.deleteDocument)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, null, 'Document deleted');
}
async function getChunks(req, res) {
    const user = req.user;
    const { id } = req.params;
    const chunks = await (0, documentService_1.getDocumentChunks)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, chunks);
}
// Handle multer errors
function handleMulterError(err, req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            (0, apiResponse_1.sendBadRequest)(res, `File too large. Maximum size is ${env_1.env.upload.maxFileSizeMb}MB.`);
            return;
        }
        (0, apiResponse_1.sendBadRequest)(res, err.message);
        return;
    }
    if (err.message === 'Only PDF files are allowed') {
        (0, apiResponse_1.sendBadRequest)(res, err.message);
        return;
    }
    next(err);
}
//# sourceMappingURL=documentController.js.map