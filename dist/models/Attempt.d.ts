import mongoose, { Document, Model } from 'mongoose';
export interface IAnswerResult {
    questionId: mongoose.Types.ObjectId;
    userAnswer: string | string[];
    isCorrect: boolean;
    isPartiallyCorrect?: boolean;
    pointsEarned: number;
}
export interface IAttempt extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    quizId: mongoose.Types.ObjectId;
    answers: IAnswerResult[];
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSpentSeconds?: number;
    completedAt: Date;
    createdAt: Date;
}
export declare const Attempt: Model<IAttempt>;
//# sourceMappingURL=Attempt.d.ts.map