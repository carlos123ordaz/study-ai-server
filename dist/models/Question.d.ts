import mongoose, { Document, Model } from 'mongoose';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export interface IOption {
    id: string;
    text: string;
}
export interface IQuestion extends Document {
    _id: mongoose.Types.ObjectId;
    quizId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: QuestionType;
    difficulty: DifficultyLevel;
    text: string;
    options?: IOption[];
    correctAnswer: string | string[];
    explanation?: string;
    sourceChunkIds?: mongoose.Types.ObjectId[];
    order: number;
    createdAt: Date;
}
export declare const Question: Model<IQuestion>;
//# sourceMappingURL=Question.d.ts.map