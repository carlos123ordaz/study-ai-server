import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { uploadLimiter } from '../middlewares/rateLimiter';
import {
  uploadMiddleware,
  uploadAndProcessDocument,
  listDocuments,
  getDocument,
  removeDocument,
  getChunks,
  handleMulterError,
} from '../controllers/documentController';

const router = Router();

// All document routes require auth
router.use(requireAuth);

// Upload and process a PDF
router.post(
  '/',
  uploadLimiter,
  (req, res, next) => {
    uploadMiddleware.single('file')(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
        return;
      }
      next();
    });
  },
  uploadAndProcessDocument
);

// List user's documents
router.get('/', listDocuments);

// Get single document
router.get('/:id', getDocument);

// Delete document
router.delete('/:id', removeDocument);

// Get document chunks (for debugging/review)
router.get('/:id/chunks', getChunks);

export default router;
