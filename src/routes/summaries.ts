import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { aiLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import {
  createSummaryValidation,
  estimateSummaryCost,
  createSummaryHandler,
  listSummaries,
  getSummaryHandler,
  deleteSummaryHandler,
} from '../controllers/summaryController';

const router = Router();

router.use(requireAuth);

router.get('/estimate', estimateSummaryCost);
router.post('/', aiLimiter, validate(createSummaryValidation), createSummaryHandler);
router.get('/', listSummaries);
router.get('/:id', getSummaryHandler);
router.delete('/:id', deleteSummaryHandler);

export default router;
