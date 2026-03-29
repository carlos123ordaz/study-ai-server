import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getCredits, getCreditTransactions } from '../controllers/creditController';

const router = Router();

router.use(requireAuth);

router.get('/', getCredits);
router.get('/transactions', getCreditTransactions);

export default router;
