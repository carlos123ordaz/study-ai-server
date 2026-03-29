import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import {
  getPackages,
  createPayment,
  confirmPaymentHandler,
  listPayments,
  paymentWebhook,
} from '../controllers/paymentController';

const router = Router();

// Webhook - no auth
router.post('/webhook', paymentWebhook);

// Protected routes
router.use(requireAuth);

router.get('/packages', getPackages);
router.post('/', createPayment);
router.post('/:id/confirm', confirmPaymentHandler);
router.get('/', listPayments);

export default router;
