import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { quizLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import {
  createQuizValidation,
  estimateCost,
  createQuizHandler,
  listQuizzes,
  getQuiz,
  getQuizReview,
  submitAttempt,
  getAttempt,
  listAttempts,
  deleteQuizHandler,
} from '../controllers/quizController';

const router = Router();

router.use(requireAuth);

// Estimate cost before generating
router.post('/estimate', estimateCost);

// Create a new quiz
router.post('/', quizLimiter, validate(createQuizValidation), createQuizHandler);

// List quizzes
router.get('/', listQuizzes);

// Get quiz for taking (answers hidden)
router.get('/:id', getQuiz);

// Get quiz with answers (for review after attempt)
router.get('/:id/review', getQuizReview);

// Delete quiz (also removes its questions and attempts)
router.delete('/:id', deleteQuizHandler);

// Submit attempt
router.post('/:id/attempts', submitAttempt);

// List all attempts for current user
router.get('/attempts/me', listAttempts);

// Get specific attempt result
router.get('/attempts/:id', getAttempt);

export default router;
