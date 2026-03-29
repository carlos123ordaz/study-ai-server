import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { aiLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import {
  createFlashcardValidation,
  estimateFlashcardCost,
  createFlashcardSetHandler,
  listFlashcardSets,
  getFlashcardSetHandler,
  deleteFlashcardSetHandler,
} from '../controllers/flashcardController';

const router = Router();

router.use(requireAuth);

router.get('/estimate', estimateFlashcardCost);
router.post('/', aiLimiter, validate(createFlashcardValidation), createFlashcardSetHandler);
router.get('/', listFlashcardSets);
router.get('/:id', getFlashcardSetHandler);
router.delete('/:id', deleteFlashcardSetHandler);

export default router;
