import mongoose, { Document, Schema, Model } from 'mongoose';

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

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    index: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    tokenEstimate: {
      type: Number,
      required: true,
    },
    charStart: {
      type: Number,
      required: true,
    },
    charEnd: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

documentChunkSchema.index({ documentId: 1, index: 1 });

export const DocumentChunk: Model<IDocumentChunk> = mongoose.model<IDocumentChunk>(
  'DocumentChunk',
  documentChunkSchema
);
