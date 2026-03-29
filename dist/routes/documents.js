"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
// All document routes require auth
router.use(auth_1.requireAuth);
// Upload and process a PDF
router.post('/', rateLimiter_1.uploadLimiter, (req, res, next) => {
    documentController_1.uploadMiddleware.single('file')(req, res, (err) => {
        if (err) {
            (0, documentController_1.handleMulterError)(err, req, res, next);
            return;
        }
        next();
    });
}, documentController_1.uploadAndProcessDocument);
// List user's documents
router.get('/', documentController_1.listDocuments);
// Get single document
router.get('/:id', documentController_1.getDocument);
// Delete document
router.delete('/:id', documentController_1.removeDocument);
// Get document chunks (for debugging/review)
router.get('/:id/chunks', documentController_1.getChunks);
exports.default = router;
//# sourceMappingURL=documents.js.map