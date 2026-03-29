import mongoose, { Document as MongoDocument, Model } from 'mongoose';
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed';
export interface IDocument extends MongoDocument {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    originalName: string;
    size: number;
    pageCount?: number;
    fileHash: string;
    storageUrl: string;
    storagePath: string;
    status: DocumentStatus;
    errorMessage?: string;
    textLength?: number;
    chunkCount?: number;
    processingCreditsUsed: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DocumentModel: Model<IDocument>;
//# sourceMappingURL=Document.d.ts.map