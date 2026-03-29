import mongoose, { Document as MongoDocument, Schema, Model } from 'mongoose';

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

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
    },
    fileHash: {
      type: String,
      required: true,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    textLength: {
      type: Number,
    },
    chunkCount: {
      type: Number,
    },
    processingCreditsUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

documentSchema.index({ userId: 1, fileHash: 1 });
documentSchema.index({ userId: 1, createdAt: -1 });

export const DocumentModel: Model<IDocument> = mongoose.model<IDocument>(
  'Document',
  documentSchema
);
