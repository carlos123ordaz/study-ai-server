import { Request, Response } from 'express';
import { IUser } from '../models/User';
import {
  getCreditPackages,
  getAvailableProviders,
  initiatePayment,
  confirmPayment,
  getUserPayments,
} from '../services/paymentService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export async function getPackages(_req: Request, res: Response): Promise<void> {
  const packages = getCreditPackages();
  const providers = getAvailableProviders();
  sendSuccess(res, { packages, providers });
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { packageIndex, returnUrl, cancelUrl, provider } = req.body;

  const result = await initiatePayment(
    user._id.toString(),
    parseInt(packageIndex),
    returnUrl,
    cancelUrl,
    provider
  );

  sendCreated(res, result, 'Payment initiated');
}

export async function confirmPaymentHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const { id } = req.params;
  const { mpPaymentId, mpStatus } = req.body;

  const transactionData: Record<string, string> = {};
  if (mpPaymentId) transactionData.mpPaymentId = String(mpPaymentId);
  if (mpStatus) transactionData.mpStatus = String(mpStatus);

  const payment = await confirmPayment(
    id,
    user._id.toString(),
    Object.keys(transactionData).length > 0 ? transactionData : undefined
  );
  sendSuccess(res, payment, 'Payment confirmed');
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await getUserPayments(user._id.toString(), page, limit);
  sendSuccess(res, result.payments, undefined, 200, { pagination: result.pagination });
}

export async function paymentWebhook(req: Request, res: Response): Promise<void> {
  // In production: validate webhook signature per provider
  res.status(200).json({ received: true });
}
