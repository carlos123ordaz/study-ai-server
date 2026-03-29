"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToBucket = uploadFileToBucket;
exports.deleteFileFromBucket = deleteFileFromBucket;
exports.getSignedUrl = getSignedUrl;
const storage_1 = require("@google-cloud/storage");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
let storage;
function getStorage() {
    if (!storage) {
        if (env_1.env.gcs.credentialsPath) {
            storage = new storage_1.Storage({
                projectId: env_1.env.gcs.projectId,
                keyFilename: env_1.env.gcs.credentialsPath,
            });
        }
        else {
            // Uses Application Default Credentials (ADC)
            storage = new storage_1.Storage({ projectId: env_1.env.gcs.projectId });
        }
    }
    return storage;
}
async function uploadFileToBucket(buffer, originalName, userId, contentType = 'application/pdf') {
    const ext = path_1.default.extname(originalName).toLowerCase();
    const fileName = `${(0, uuid_1.v4)()}${ext}`;
    const storagePath = `documents/${userId}/${fileName}`;
    try {
        const bucket = getStorage().bucket(env_1.env.gcs.bucketName);
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
        const storageUrl = `https://storage.googleapis.com/${env_1.env.gcs.bucketName}/${storagePath}`;
        logger_1.logger.debug(`File uploaded to GCS: ${storagePath}`);
        return { storageUrl, storagePath };
    }
    catch (error) {
        logger_1.logger.error('GCS upload error:', error);
        throw new Error(`Failed to upload file to storage: ${error.message}`);
    }
}
async function deleteFileFromBucket(storagePath) {
    try {
        const bucket = getStorage().bucket(env_1.env.gcs.bucketName);
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        logger_1.logger.debug(`File deleted from GCS: ${storagePath}`);
    }
    catch (error) {
        logger_1.logger.warn(`Failed to delete file from GCS (${storagePath}):`, error);
    }
}
async function getSignedUrl(storagePath, expiresInMs = 3600000) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMs,
    };
    const [url] = await getStorage()
        .bucket(env_1.env.gcs.bucketName)
        .file(storagePath)
        .getSignedUrl(options);
    return url;
}
//# sourceMappingURL=googleStorage.js.map