"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProcessingCost = calculateProcessingCost;
exports.calculateQuizCost = calculateQuizCost;
exports.getUserCredits = getUserCredits;
exports.deductCredits = deductCredits;
exports.addCredits = addCredits;
exports.refundCredits = refundCredits;
exports.getCreditHistory = getCreditHistory;
const User_1 = require("../models/User");
const CreditTransaction_1 = require("../models/CreditTransaction");
const errorHandler_1 = require("../middlewares/errorHandler");
const logger_1 = require("../utils/logger");
// ========================
// CREDIT COST RULES
// ========================
const PROCESSING_COSTS = {
    '1-10': 5,
    '11-30': 10,
    '31-80': 20,
    '81-150': 35,
    '151+': 50,
};
const QUESTION_COSTS = {
    true_false: 1,
    single_choice: 2,
    fill_in_blank: 2,
    multiple_choice: 3,
    short_answer: 3,
};
const DIFFICULTY_MULTIPLIERS = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
};
function calculateProcessingCost(pageCount) {
    if (pageCount <= 10)
        return PROCESSING_COSTS['1-10'];
    if (pageCount <= 30)
        return PROCESSING_COSTS['11-30'];
    if (pageCount <= 80)
        return PROCESSING_COSTS['31-80'];
    if (pageCount <= 150)
        return PROCESSING_COSTS['81-150'];
    return PROCESSING_COSTS['151+'];
}
function calculateQuizCost(questionTypes, questionCount, difficulty, includeExplanations) {
    if (questionTypes.length === 0) {
        throw new Error('At least one question type is required');
    }
    // Average cost across selected types
    const avgTypeCost = questionTypes.reduce((sum, type) => sum + QUESTION_COSTS[type], 0) / questionTypes.length;
    const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    const explanationCostPerQ = includeExplanations ? 1 : 0;
    const perQuestion = avgTypeCost * multiplier + explanationCostPerQ;
    const baseCost = Math.ceil(avgTypeCost * questionCount);
    const total = Math.ceil(perQuestion * questionCount);
    return {
        baseCost,
        difficultyMultiplier: multiplier,
        explanationCost: explanationCostPerQ * questionCount,
        total,
        perQuestion: Math.ceil(perQuestion),
    };
}
// ========================
// CREDIT OPERATIONS
// ========================
async function getUserCredits(userId) {
    const user = await User_1.User.findById(userId).select('credits');
    return user?.credits ?? 0;
}
async function deductCredits(userId, amount, type, description, referenceId, referenceModel, session) {
    const opts = session ? { session } : {};
    const user = await User_1.User.findById(userId).session(session ?? null);
    if (!user)
        throw new Error('User not found');
    if (user.credits < amount) {
        throw new errorHandler_1.InsufficientCreditsError(amount, user.credits);
    }
    const balanceBefore = user.credits;
    user.credits -= amount;
    await user.save(opts);
    await CreditTransaction_1.CreditTransaction.create([
        {
            userId,
            type,
            amount: -amount,
            balanceBefore,
            balanceAfter: user.credits,
            status: 'completed',
            description,
            referenceId,
            referenceModel,
        },
    ], opts);
    logger_1.logger.debug(`Credits deducted: user=${userId}, amount=${amount}, balance=${user.credits}`);
    return user;
}
async function addCredits(userId, amount, type, description, referenceId, referenceModel, session) {
    const opts = session ? { session } : {};
    const user = await User_1.User.findById(userId).session(session ?? null);
    if (!user)
        throw new Error('User not found');
    const balanceBefore = user.credits;
    user.credits += amount;
    await user.save(opts);
    await CreditTransaction_1.CreditTransaction.create([
        {
            userId,
            type,
            amount,
            balanceBefore,
            balanceAfter: user.credits,
            status: 'completed',
            description,
            referenceId,
            referenceModel,
        },
    ], opts);
    logger_1.logger.debug(`Credits added: user=${userId}, amount=${amount}, balance=${user.credits}`);
    return user;
}
async function refundCredits(userId, amount, type, description, referenceId) {
    return addCredits(userId, amount, type, description, referenceId);
}
async function getCreditHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
        CreditTransaction_1.CreditTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        CreditTransaction_1.CreditTransaction.countDocuments({ userId }),
    ]);
    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}
//# sourceMappingURL=creditService.js.map