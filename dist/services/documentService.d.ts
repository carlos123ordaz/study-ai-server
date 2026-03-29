import mongoose from 'mongoose';
import { IDocument } from '../models/Document';
export declare function uploadDocument(userId: string, fileBuffer: Buffer, originalName: string, fileSizeBytes: number): Promise<IDocument>;
export declare function processDocument(documentId: string, userId: string): Promise<IDocument>;
export declare function processDocumentWithBuffer(documentId: string, userId: string, fileBuffer: Buffer): Promise<IDocument>;
export declare function getUserDocuments(userId: string, page?: number, limit?: number): Promise<{
    documents: (mongoose.FlattenMaps<IDocument> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
export declare function getDocumentById(documentId: string, userId: string): Promise<IDocument>;
export declare function deleteDocument(documentId: string, userId: string): Promise<void>;
export declare function getDocumentChunks(documentId: string, userId: string): Promise<(mongoose.FlattenMaps<import("../models/DocumentChunk").IDocumentChunk> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=documentService.d.ts.map