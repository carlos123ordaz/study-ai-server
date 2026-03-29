import { Request, Response } from 'express';
import { IUser } from '../models/User';
import { getUserCredits, getCreditHistory } from '../services/creditService';
import { sendSuccess } from '../utils/apiResponse';

export async function getCredits(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const credits = await getUserCredits(user._id.toString());
  sendSuccess(res, { credits });
}

export async function getCreditTransactions(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getCreditHistory(user._id.toString(), page, limit);
  sendSuccess(res, result.transactions, undefined, 200, {
    pagination: result.pagination,
  });
}
