import mongoose, { Document, Schema, Model } from 'mongoose';

export type TransactionType =
  | 'initial_grant'
  | 'document_processing'
  | 'quiz_generation'
  | 'quiz_generation_refund'
  | 'document_processing_refund'
  | 'payment_recharge'
  | 'admin_adjustment';

export type TransactionStatus = 'completed' | 'pending' | 'reversed';

export interface ICreditTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;      // positive = credit, negative = debit
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'initial_grant',
        'document_processing',
        'quiz_generation',
        'quiz_generation_refund',
        'document_processing_refund',
        'payment_recharge',
        'admin_adjustment',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'reversed'],
      default: 'completed',
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    referenceModel: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ referenceId: 1, type: 1 });

export const CreditTransaction: Model<ICreditTransaction> =
  mongoose.model<ICreditTransaction>('CreditTransaction', creditTransactionSchema);
