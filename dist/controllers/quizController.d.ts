import { Request, Response } from 'express';
export declare const createQuizValidation: import("express-validator").ValidationChain[];
export declare function estimateCost(req: Request, res: Response): Promise<void>;
export declare function createQuizHandler(req: Request, res: Response): Promise<void>;
export declare function listQuizzes(req: Request, res: Response): Promise<void>;
export declare function getQuiz(req: Request, res: Response): Promise<void>;
export declare function getQuizReview(req: Request, res: Response): Promise<void>;
export declare function submitAttempt(req: Request, res: Response): Promise<void>;
export declare function getAttempt(req: Request, res: Response): Promise<void>;
export declare function listAttempts(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=quizController.d.ts.map