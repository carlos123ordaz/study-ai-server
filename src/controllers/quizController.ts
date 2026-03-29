import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { IUser } from '../models/User';
import {
  createQuiz,
  estimateQuizCost,
  getQuizWithQuestions,
  getQuizForReview,
  getUserQuizzes,
  submitQuizAttempt,
  getAttemptResult,
  getUserAttempts,
  deleteQuiz,
} from '../services/quizService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const createQuizValidation = [
  body('documentIds').isArray({ min: 1 }).withMessage('At least one document required'),
  body('documentIds.*').isMongoId().withMessage('Invalid document ID'),
  body('questionTypes')
    .isArray({ min: 1 })
    .withMessage('At least one question type required'),
  body('questionTypes.*')
    .isIn(['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'short_answer'])
    .withMessage('Invalid question type'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('questionCount')
    .isInt({ min: 1, max: 50 })
    .withMessage('Question count must be between 1 and 50'),
  body('includeExplanations').isBoolean().withMessage('includeExplanations must be boolean'),
  body('title').optional().isString().isLength({ max: 200 }),
];

export async function estimateCost(req: Request, res: Response): Promise<void> {
  const { questionTypes, questionCount, difficulty, includeExplanations } = req.body;
  const breakdown = await estimateQuizCost({
    questionTypes,
    questionCount,
    difficulty,
    includeExplanations,
  });
  sendSuccess(res, breakdown);
}

export async function createQuizHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { documentIds, questionTypes, difficulty, questionCount, includeExplanations, title } =
    req.body;

  const quiz = await createQuiz({
    userId: user._id.toString(),
    documentIds,
    questionTypes,
    difficulty,
    questionCount,
    includeExplanations,
    title,
  });

  sendCreated(res, quiz, 'Quiz generated successfully');
}

export async function listQuizzes(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserQuizzes(user._id.toString(), page, limit);
  sendSuccess(res, result.quizzes, undefined, 200, { pagination: result.pagination });
}

export async function getQuiz(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const result = await getQuizWithQuestions(id, user._id.toString());
  sendSuccess(res, result);
}

export async function getQuizReview(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const result = await getQuizForReview(id, user._id.toString());
  sendSuccess(res, result);
}

export async function submitAttempt(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;
  const { answers, timeSpentSeconds } = req.body;

  const attempt = await submitQuizAttempt(
    id,
    user._id.toString(),
    answers,
    timeSpentSeconds
  );

  sendCreated(res, attempt, 'Quiz submitted successfully');
}

export async function getAttempt(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const result = await getAttemptResult(id, user._id.toString());
  sendSuccess(res, result);
}

export async function deleteQuizHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  await deleteQuiz(id, user._id.toString());
  sendSuccess(res, null, 'Quiz eliminado');
}

export async function listAttempts(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserAttempts(user._id.toString(), page, limit);
  sendSuccess(res, result.attempts, undefined, 200, { pagination: result.pagination });
}
