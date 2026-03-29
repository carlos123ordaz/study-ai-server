import mongoose, { Document, Model } from 'mongoose';
import { QuestionType, DifficultyLevel } from './Question';
export type QuizStatus = 'generating' | 'ready' | 'failed';
export interface IQuiz extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    documentIds: mongoose.Types.ObjectId[];
    title: string;
    questionTypes: QuestionType[];
    difficulty: DifficultyLevel;
    questionCount: number;
    includeExplanations: boolean;
    status: QuizStatus;
    creditsUsed: number;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Quiz: Model<IQuiz>;
//# sourceMappingURL=Quiz.d.ts.map