import mongoose, { Document, Schema, Model } from 'mongoose';

export type SummaryStatus = 'generating' | 'ready' | 'failed';

export interface ISummarySection {
  heading: string;
  body: string;
}

export interface IKeyTerm {
  term: string;
  definition: string;
}

export interface ISummaryContent {
  overview: string;
  sections: ISummarySection[];
  keyTerms: IKeyTerm[];
}

export interface ISummary extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  title: string;
  content: ISummaryContent;
  status: SummaryStatus;
  creditsUsed: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const summarySchema = new Schema<ISummary>(
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
    content: {
      overview: { type: String, default: '' },
      sections: [
        {
          heading: { type: String, required: true },
          body: { type: String, required: true },
          _id: false,
        },
      ],
      keyTerms: [
        {
          term: { type: String, required: true },
          definition: { type: String, required: true },
          _id: false,
        },
      ],
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

summarySchema.index({ userId: 1, createdAt: -1 });

export const Summary: Model<ISummary> = mongoose.model<ISummary>('Summary', summarySchema);
