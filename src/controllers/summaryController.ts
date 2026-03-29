import { Request, Response } from 'express';
import { body } from 'express-validator';
import { IUser } from '../models/User';
import {
  createSummary,
  getUserSummaries,
  getSummary,
  deleteSummary,
} from '../services/summaryService';
import { SUMMARY_COST } from '../services/creditService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const createSummaryValidation = [
  body('documentId').isMongoId().withMessage('Invalid document ID'),
];

export async function estimateSummaryCost(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { total: SUMMARY_COST });
}

export async function createSummaryHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { documentId } = req.body;

  const summary = await createSummary(user._id.toString(), documentId);
  sendCreated(res, summary, 'Resumen generado correctamente');
}

export async function listSummaries(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserSummaries(user._id.toString(), page, limit);
  sendSuccess(res, result.summaries, undefined, 200, { pagination: result.pagination });
}

export async function getSummaryHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  const summary = await getSummary(id, user._id.toString());
  sendSuccess(res, summary);
}

export async function deleteSummaryHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;

  await deleteSummary(id, user._id.toString());
  sendSuccess(res, null, 'Resumen eliminado');
}
