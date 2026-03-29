import mongoose, { Document, Model } from 'mongoose';
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
export declare const Payment: Model<IPayment>;
export declare const CREDIT_PACKAGES: ICreditPackage[];
//# sourceMappingURL=Payment.d.ts.map