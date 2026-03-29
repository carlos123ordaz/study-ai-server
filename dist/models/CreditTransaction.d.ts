import mongoose, { Document, Model } from 'mongoose';
export type TransactionType = 'initial_grant' | 'document_processing' | 'quiz_generation' | 'quiz_generation_refund' | 'document_processing_refund' | 'payment_recharge' | 'admin_adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'reversed';
export interface ICreditTransaction extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: TransactionStatus;
    description: string;
    referenceId?: mongoose.Types.ObjectId;
    referenceModel?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export declare const CreditTransaction: Model<ICreditTransaction>;
//# sourceMappingURL=CreditTransaction.d.ts.map