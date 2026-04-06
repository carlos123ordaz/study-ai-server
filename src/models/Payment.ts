import mongoose, { Document, Schema, Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentProvider = 'mock' | 'mercadopago' | 'paypal';

export interface ICreditPackage {
  credits: number;
  priceUsd: number;
  label: string;
}

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: PaymentProvider;
  externalPaymentId?: string;
  status: PaymentStatus;
  creditsAmount: number;
  priceUsd: number;
  currency: string;
  creditTransactionId?: mongoose.Types.ObjectId;
  providerData?: Record<string, unknown>;
  errorMessage?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['mock', 'mercadopago', 'paypal'],
      required: true,
    },
    externalPaymentId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true,
    },
    creditsAmount: {
      type: Number,
      required: true,
    },
    priceUsd: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    creditTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'CreditTransaction',
    },
    providerData: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);

// Available credit packages
export const CREDIT_PACKAGES: ICreditPackage[] = [
  { credits: 1000, priceUsd: 2.99, label: 'Starter' },
  { credits: 3000, priceUsd: 7.99, label: 'Popular' },
  { credits: 7000, priceUsd: 14.99, label: 'Pro' },
  { credits: 15000, priceUsd: 24.99, label: 'Power' },
];
