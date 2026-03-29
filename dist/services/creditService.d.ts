import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { TransactionType } from '../models/CreditTransaction';
import { QuestionType, DifficultyLevel } from '../models/Question';
export declare function calculateProcessingCost(pageCount: number): number;
export interface QuizCostBreakdown {
    baseCost: number;
    difficultyMultiplier: number;
    explanationCost: number;
    total: number;
    perQuestion: number;
}
export declare function calculateQuizCost(questionTypes: QuestionType[], questionCount: number, difficulty: DifficultyLevel, includeExplanations: boolean): QuizCostBreakdown;
export declare function getUserCredits(userId: string): Promise<number>;
export declare function deductCredits(userId: string, amount: number, type: TransactionType, description: string, referenceId?: mongoose.Types.ObjectId, referenceModel?: string, session?: mongoose.ClientSession): Promise<IUser>;
export declare function addCredits(userId: string, amount: number, type: TransactionType, description: string, referenceId?: mongoose.Types.ObjectId, referenceModel?: string, session?: mongoose.ClientSession): Promise<IUser>;
export declare function refundCredits(userId: string, amount: number, type: TransactionType, description: string, referenceId?: mongoose.Types.ObjectId): Promise<IUser>;
export declare function getCreditHistory(userId: string, page?: number, limit?: number): Promise<{
    transactions: (mongoose.FlattenMaps<import("../models/CreditTransaction").ICreditTransaction> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}>;
//# sourceMappingURL=creditService.d.ts.map