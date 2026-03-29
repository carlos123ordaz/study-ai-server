"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuizValidation = void 0;
exports.estimateCost = estimateCost;
exports.createQuizHandler = createQuizHandler;
exports.listQuizzes = listQuizzes;
exports.getQuiz = getQuiz;
exports.getQuizReview = getQuizReview;
exports.submitAttempt = submitAttempt;
exports.getAttempt = getAttempt;
exports.listAttempts = listAttempts;
const express_validator_1 = require("express-validator");
const quizService_1 = require("../services/quizService");
const apiResponse_1 = require("../utils/apiResponse");
exports.createQuizValidation = [
    (0, express_validator_1.body)('documentIds').isArray({ min: 1 }).withMessage('At least one document required'),
    (0, express_validator_1.body)('documentIds.*').isMongoId().withMessage('Invalid document ID'),
    (0, express_validator_1.body)('questionTypes')
        .isArray({ min: 1 })
        .withMessage('At least one question type required'),
    (0, express_validator_1.body)('questionTypes.*')
        .isIn(['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'short_answer'])
        .withMessage('Invalid question type'),
    (0, express_validator_1.body)('difficulty')
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    (0, express_validator_1.body)('questionCount')
        .isInt({ min: 1, max: 50 })
        .withMessage('Question count must be between 1 and 50'),
    (0, express_validator_1.body)('includeExplanations').isBoolean().withMessage('includeExplanations must be boolean'),
    (0, express_validator_1.body)('title').optional().isString().isLength({ max: 200 }),
];
async function estimateCost(req, res) {
    const { questionTypes, questionCount, difficulty, includeExplanations } = req.body;
    const breakdown = await (0, quizService_1.estimateQuizCost)({
        questionTypes,
        questionCount,
        difficulty,
        includeExplanations,
    });
    (0, apiResponse_1.sendSuccess)(res, breakdown);
}
async function createQuizHandler(req, res) {
    const user = req.user;
    const { documentIds, questionTypes, difficulty, questionCount, includeExplanations, title } = req.body;
    const quiz = await (0, quizService_1.createQuiz)({
        userId: user._id.toString(),
        documentIds,
        questionTypes,
        difficulty,
        questionCount,
        includeExplanations,
        title,
    });
    (0, apiResponse_1.sendCreated)(res, quiz, 'Quiz generated successfully');
}
async function listQuizzes(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await (0, quizService_1.getUserQuizzes)(user._id.toString(), page, limit);
    (0, apiResponse_1.sendSuccess)(res, result.quizzes, undefined, 200, { pagination: result.pagination });
}
async function getQuiz(req, res) {
    const user = req.user;
    const { id } = req.params;
    const result = await (0, quizService_1.getQuizWithQuestions)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, result);
}
async function getQuizReview(req, res) {
    const user = req.user;
    const { id } = req.params;
    const result = await (0, quizService_1.getQuizForReview)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, result);
}
async function submitAttempt(req, res) {
    const user = req.user;
    const { id } = req.params;
    const { answers, timeSpentSeconds } = req.body;
    const attempt = await (0, quizService_1.submitQuizAttempt)(id, user._id.toString(), answers, timeSpentSeconds);
    (0, apiResponse_1.sendCreated)(res, attempt, 'Quiz submitted successfully');
}
async function getAttempt(req, res) {
    const user = req.user;
    const { id } = req.params;
    const result = await (0, quizService_1.getAttemptResult)(id, user._id.toString());
    (0, apiResponse_1.sendSuccess)(res, result);
}
async function listAttempts(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const result = await (0, quizService_1.getUserAttempts)(user._id.toString(), page, limit);
    (0, apiResponse_1.sendSuccess)(res, result.attempts, undefined, 200, { pagination: result.pagination });
}
//# sourceMappingURL=quizController.js.map