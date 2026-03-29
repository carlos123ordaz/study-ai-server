import { QuestionType, DifficultyLevel } from '../models/Question';
export interface GeneratedQuestion {
    type: QuestionType;
    text: string;
    options?: {
        id: string;
        text: string;
    }[];
    correctAnswer: string | string[];
    explanation?: string;
}
export interface QuizGenerationInput {
    content: string;
    questionTypes: QuestionType[];
    questionCount: number;
    difficulty: DifficultyLevel;
    includeExplanations: boolean;
}
export declare function generateQuizQuestions(input: QuizGenerationInput): Promise<GeneratedQuestion[]>;
//# sourceMappingURL=gemini.d.ts.map