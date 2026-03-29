"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateQuizCost = estimateQuizCost;
exports.createQuiz = createQuiz;
exports.getQuizWithQuestions = getQuizWithQuestions;
exports.getQuizForReview = getQuizForReview;
exports.getUserQuizzes = getUserQuizzes;
exports.submitQuizAttempt = submitQuizAttempt;
exports.getAttemptResult = getAttemptResult;
exports.getUserAttempts = getUserAttempts;
const Quiz_1 = require("../models/Quiz");
const Question_1 = require("../models/Question");
const Attempt_1 = require("../models/Attempt");
const DocumentChunk_1 = require("../models/DocumentChunk");
const Document_1 = require("../models/Document");
const gemini_1 = require("../integrations/gemini");
const creditService_1 = require("./creditService");
const textChunker_1 = require("../utils/textChunker");
const errorHandler_1 = require("../middlewares/errorHandler");
const logger_1 = require("../utils/logger");
async function estimateQuizCost(input) {
    return (0, creditService_1.calculateQuizCost)(input.questionTypes, input.questionCount, input.difficulty, input.includeExplanations);
}
async function createQuiz(input) {
    const { userId, documentIds, questionTypes, difficulty, questionCount, includeExplanations } = input;
    // Validate documents ownership
    const documents = await Document_1.DocumentModel.find({
        _id: { $in: documentIds },
        userId,
        status: 'processed',
    });
    if (documents.length !== documentIds.length) {
        throw new errorHandler_1.BadRequestError('One or more documents are invalid, not processed, or do not belong to you.');
    }
    // Calculate cost
    const costBreakdown = (0, creditService_1.calculateQuizCost)(questionTypes, questionCount, difficulty, includeExplanations);
    // Generate title if not provided
    const title = input.title ||
        `Quiz - ${documents.map((d) => d.name).join(', ')} (${difficulty})`;
    // Create quiz record immediately
    const quiz = await Quiz_1.Quiz.create({
        userId,
        documentIds,
        title,
        questionTypes,
        difficulty,
        questionCount,
        includeExplanations,
        status: 'generating',
        creditsUsed: costBreakdown.total,
    });
    let creditsDeducted = false;
    try {
        // Deduct credits (reserve)
        await (0, creditService_1.deductCredits)(userId, costBreakdown.total, 'quiz_generation', `Generating quiz "${title}" (${questionCount} questions, ${difficulty})`, quiz._id, 'Quiz');
        creditsDeducted = true;
        // Gather content from document chunks
        const chunks = await DocumentChunk_1.DocumentChunk.find({
            documentId: { $in: documentIds },
            userId,
        }).sort({ documentId: 1, index: 1 });
        const relevantChunks = (0, textChunker_1.selectRelevantChunks)(chunks, 30000);
        const content = relevantChunks.map((c) => c.text).join('\n\n---\n\n');
        if (content.trim().length < 100) {
            throw new errorHandler_1.BadRequestError('Insufficient content in selected documents to generate questions.');
        }
        // Generate questions with Gemini
        const generatedQuestions = await (0, gemini_1.generateQuizQuestions)({
            content,
            questionTypes,
            questionCount,
            difficulty,
            includeExplanations,
        });
        if (generatedQuestions.length === 0) {
            throw new Error('AI failed to generate valid questions from the provided content.');
        }
        // Save questions
        const questionDocs = await Question_1.Question.insertMany(generatedQuestions.map((q, idx) => ({
            quizId: quiz._id,
            userId,
            type: q.type,
            difficulty,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: idx,
        })));
        // Update quiz as ready
        quiz.status = 'ready';
        quiz.questionCount = questionDocs.length;
        await quiz.save();
        logger_1.logger.info(`Quiz created: ${quiz._id}, questions=${questionDocs.length}, user=${userId}`);
        return quiz;
    }
    catch (error) {
        // Mark as failed
        quiz.status = 'failed';
        quiz.errorMessage = error.message;
        await quiz.save();
        // Refund credits if deducted
        if (creditsDeducted) {
            await (0, creditService_1.refundCredits)(userId, costBreakdown.total, 'quiz_generation_refund', `Refund for failed quiz generation "${title}"`, quiz._id);
        }
        logger_1.logger.error(`Quiz generation failed: ${quiz._id}`, error);
        throw error;
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getQuizWithQuestions(quizId, userId) {
    const quiz = await Quiz_1.Quiz.findById(quizId).lean();
    if (!quiz)
        throw new errorHandler_1.NotFoundError('Quiz');
    if (quiz.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    const questions = await Question_1.Question.find({ quizId }).sort({ order: 1 }).lean();
    // Remove correct answers for the quiz-taking view
    const sanitizedQuestions = questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        void correctAnswer;
        void explanation;
        return rest;
    });
    return { quiz, questions: sanitizedQuestions };
}
async function getQuizForReview(quizId, userId) {
    const quiz = await Quiz_1.Quiz.findById(quizId).lean();
    if (!quiz)
        throw new errorHandler_1.NotFoundError('Quiz');
    if (quiz.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    const questions = await Question_1.Question.find({ quizId }).sort({ order: 1 }).lean();
    return { quiz, questions };
}
async function getUserQuizzes(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [quizzes, total] = await Promise.all([
        Quiz_1.Quiz.find({ userId, status: 'ready' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Quiz_1.Quiz.countDocuments({ userId, status: 'ready' }),
    ]);
    return {
        quizzes,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function submitQuizAttempt(quizId, userId, answers, timeSpentSeconds) {
    const quiz = await Quiz_1.Quiz.findById(quizId);
    if (!quiz)
        throw new errorHandler_1.NotFoundError('Quiz');
    if (quiz.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    if (quiz.status !== 'ready')
        throw new errorHandler_1.BadRequestError('Quiz is not available.');
    const questions = await Question_1.Question.find({ quizId }).sort({ order: 1 });
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
    let correctCount = 0;
    const answerResults = questions.map((q) => {
        const userAnswer = answerMap.get(q._id.toString()) ?? '';
        const { isCorrect, isPartiallyCorrect } = evaluateAnswer(q.type, userAnswer, q.correctAnswer);
        if (isCorrect)
            correctCount++;
        return {
            questionId: q._id,
            userAnswer,
            isCorrect,
            isPartiallyCorrect,
            pointsEarned: isCorrect ? 1 : 0,
        };
    });
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const attempt = await Attempt_1.Attempt.create({
        userId,
        quizId,
        answers: answerResults,
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpentSeconds,
        completedAt: new Date(),
    });
    return attempt;
}
async function getAttemptResult(attemptId, userId) {
    const attempt = await Attempt_1.Attempt.findById(attemptId);
    if (!attempt)
        throw new errorHandler_1.NotFoundError('Attempt');
    if (attempt.userId.toString() !== userId)
        throw new errorHandler_1.ForbiddenError();
    const quiz = await Quiz_1.Quiz.findById(attempt.quizId).lean();
    if (!quiz)
        throw new errorHandler_1.NotFoundError('Quiz');
    const questions = await Question_1.Question.find({ quizId: attempt.quizId })
        .sort({ order: 1 })
        .lean();
    return { attempt, quiz, questions };
}
async function getUserAttempts(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
        Attempt_1.Attempt.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('quizId', 'title difficulty questionCount')
            .lean(),
        Attempt_1.Attempt.countDocuments({ userId }),
    ]);
    return {
        attempts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
function evaluateAnswer(type, userAnswer, correctAnswer) {
    if (type === 'multiple_choice') {
        const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
        const correctSet = new Set(Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]);
        const correct = [...correctSet].every((a) => userSet.has(a)) && userSet.size === correctSet.size;
        const partial = !correct &&
            [...correctSet].some((a) => userSet.has(a)) &&
            userSet.size <= correctSet.size;
        return { isCorrect: correct, isPartiallyCorrect: partial };
    }
    if (type === 'true_false') {
        const ua = (Array.isArray(userAnswer) ? userAnswer[0] : userAnswer).toLowerCase().trim();
        const ca = (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer).toLowerCase().trim();
        return { isCorrect: ua === ca };
    }
    if (type === 'single_choice') {
        const ua = (Array.isArray(userAnswer) ? userAnswer[0] : userAnswer).trim();
        const ca = (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer).trim();
        return { isCorrect: ua.toLowerCase() === ca.toLowerCase() };
    }
    if (type === 'fill_in_blank') {
        const ua = (Array.isArray(userAnswer) ? userAnswer[0] : userAnswer).trim().toLowerCase();
        const ca = (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer).trim().toLowerCase();
        return { isCorrect: ua === ca };
    }
    // short_answer - basic similarity check
    if (type === 'short_answer') {
        const ua = (Array.isArray(userAnswer) ? userAnswer[0] : userAnswer).trim().toLowerCase();
        const ca = (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer).trim().toLowerCase();
        // Mark as correct if answer contains key words from correct answer
        const caWords = ca.split(/\s+/).filter((w) => w.length > 4);
        const matchingWords = caWords.filter((w) => ua.includes(w));
        const isCorrect = caWords.length > 0 && matchingWords.length / caWords.length >= 0.5;
        return { isCorrect };
    }
    return { isCorrect: false };
}
//# sourceMappingURL=quizService.js.map