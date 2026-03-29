import mongoose from 'mongoose';
import { IQuiz } from '../models/Quiz';
import { QuestionType, DifficultyLevel } from '../models/Question';
export interface CreateQuizInput {
    userId: string;
    documentIds: string[];
    title?: string;
    questionTypes: QuestionType[];
    difficulty: DifficultyLevel;
    questionCount: number;
    includeExplanations: boolean;
}
export declare function estimateQuizCost(input: Omit<CreateQuizInput, 'userId' | 'documentIds' | 'title'>): Promise<import("./creditService").QuizCostBreakdown>;
export declare function createQuiz(input: CreateQuizInput): Promise<IQuiz>;
export declare function getQuizWithQuestions(quizId: string, userId: string): Promise<{
    quiz: any;
    questions: any[];
}>;
export declare function getQuizForReview(quizId: string, userId: string): Promise<{
    quiz: mongoose.FlattenMaps<IQuiz> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    questions: (mongoose.FlattenMaps<import("../models/Question").IQuestion> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
}>;
export declare function getUserQuizzes(userId: string, page?: number, limit?: number): Promise<{
    quizzes: (mongoose.FlattenMaps<IQuiz> & Required<{
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
export declare function submitQuizAttempt(quizId: string, userId: string, answers: {
    questionId: string;
    answer: string | string[];
}[], timeSpentSeconds?: number): Promise<mongoose.Document<unknown, {}, import("../models/Attempt").IAttempt, {}, {}> & import("../models/Attempt").IAttempt & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getAttemptResult(attemptId: string, userId: string): Promise<{
    attempt: mongoose.Document<unknown, {}, import("../models/Attempt").IAttempt, {}, {}> & import("../models/Attempt").IAttempt & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    quiz: mongoose.FlattenMaps<IQuiz> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    };
    questions: (mongoose.FlattenMaps<import("../models/Question").IQuestion> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
}>;
export declare function getUserAttempts(userId: string, page?: number, limit?: number): Promise<{
    attempts: (mongoose.FlattenMaps<import("../models/Attempt").IAttempt> & Required<{
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
//# sourceMappingURL=quizService.d.ts.map