import mongoose, { Document, Schema, Model } from 'mongoose';

export type FlashcardSetStatus = 'generating' | 'ready' | 'failed';

export interface IFlashcard {
  front: string;
  back: string;
}

export interface IFlashcardSet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  title: string;
  cards: IFlashcard[];
  cardCount: number;
  status: FlashcardSetStatus;
  creditsUsed: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSetSchema = new Schema<IFlashcardSet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    cards: [
      {
        front: { type: String, required: true },
        back: { type: String, required: true },
        _id: false,
      },
    ],
    cardCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
      index: true,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

flashcardSetSchema.index({ userId: 1, createdAt: -1 });

export const FlashcardSet: Model<IFlashcardSet> = mongoose.model<IFlashcardSet>(
  'FlashcardSet',
  flashcardSetSchema
);
