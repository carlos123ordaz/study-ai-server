"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const validate_1 = require("../middlewares/validate");
const quizController_1 = require("../controllers/quizController");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Estimate cost before generating
router.post('/estimate', quizController_1.estimateCost);
// Create a new quiz
router.post('/', rateLimiter_1.quizLimiter, (0, validate_1.validate)(quizController_1.createQuizValidation), quizController_1.createQuizHandler);
// List quizzes
router.get('/', quizController_1.listQuizzes);
// Get quiz for taking (answers hidden)
router.get('/:id', quizController_1.getQuiz);
// Get quiz with answers (for review after attempt)
router.get('/:id/review', quizController_1.getQuizReview);
// Submit attempt
router.post('/:id/attempts', quizController_1.submitAttempt);
// List all attempts for current user
router.get('/attempts/me', quizController_1.listAttempts);
// Get specific attempt result
router.get('/attempts/:id', quizController_1.getAttempt);
exports.default = router;
//# sourceMappingURL=quizzes.js.map