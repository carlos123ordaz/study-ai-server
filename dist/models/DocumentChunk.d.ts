import mongoose, { Document, Model } from 'mongoose';
export interface IDocumentChunk extends Document {
    _id: mongoose.Types.ObjectId;
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    index: number;
    text: string;
    tokenEstimate: number;
    charStart: number;
    charEnd: number;
    createdAt: Date;
}
export declare const DocumentChunk: Model<IDocumentChunk>;
//# sourceMappingURL=DocumentChunk.d.ts.map