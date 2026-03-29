import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { IUser } from '../models/User';
import {
  createFlashcardSet,
  getUserFlashcardSets,
  getFlashcardSet,
  deleteFlashcardSet,
} from '../services/flashcardService';
import { FLASHCARD_COST } from '../services/creditService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const createFlashcardValidation = [
  body('documentId').isMongoId().withMessage('Invalid document ID'),
  body('cardCount')
    .optional()
    .isInt({ min: 5, max: 40 })
    .withMessage('Card count must be between 5 and 40'),
];

export async function estimateFlashcardCost(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { total: FLASHCARD_COST });
}

export async function createFlashcardSetHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { documentId, cardCount } = req.body;

  const set = await createFlashcardSet(user._id.toString(), documentId, cardCount ?? 20);
  sendCreated(res, set, 'Flashcards generados correctamente');
}

export async function listFlashcardSets(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserFlashcardSets(user._id.toString(), page, limit);
  sendSuccess(res, result.sets, undefined, 200, { pagination: result.pagination });
}

export async function getFlashcardSetHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const set = await getFlashcardSet(id, user._id.toString());
  sendSuccess(res, set);
}

export async function deleteFlashcardSetHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  await deleteFlashcardSet(id, user._id.toString());
  sendSuccess(res, null, 'Flashcards eliminados');
}
