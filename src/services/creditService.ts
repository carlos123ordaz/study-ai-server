import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { CreditTransaction, TransactionType } from '../models/CreditTransaction';
import { QuestionType, DifficultyLevel } from '../models/Question';
import { InsufficientCreditsError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

// ========================
// CREDIT COST RULES
// ========================

const PROCESSING_COSTS: Record<string, number> = {
  '1-10': 5,
  '11-30': 10,
  '31-80': 20,
  '81-150': 35,
  '151+': 50,
};

const QUESTION_COSTS: Record<QuestionType, number> = {
  true_false: 1,
  single_choice: 2,
  fill_in_blank: 2,
  multiple_choice: 3,
  short_answer: 3,
};

const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  easy: 1.0,
  medium: 1.2,
  hard: 1.5,
};

export function calculateProcessingCost(pageCount: number): number {
  if (pageCount <= 10) return PROCESSING_COSTS['1-10'];
  if (pageCount <= 30) return PROCESSING_COSTS['11-30'];
  if (pageCount <= 80) return PROCESSING_COSTS['31-80'];
  if (pageCount <= 150) return PROCESSING_COSTS['81-150'];
  return PROCESSING_COSTS['151+'];
}

export interface QuizCostBreakdown {
  baseCost: number;
  difficultyMultiplier: number;
  explanationCost: number;
  total: number;
  perQuestion: number;
}

export function calculateQuizCost(
  questionTypes: QuestionType[],
  questionCount: number,
  difficulty: DifficultyLevel,
  includeExplanations: boolean
): QuizCostBreakdown {
  if (questionTypes.length === 0) {
    throw new Error('At least one question type is required');
  }

  // Average cost across selected types
  const avgTypeCost =
    questionTypes.reduce((sum, type) => sum + QUESTION_COSTS[type], 0) / questionTypes.length;

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

export const FLASHCARD_COST = 10; // flat per set (~20 cards)
export const SUMMARY_COST = 15;   // flat per summary

// ========================
// CREDIT OPERATIONS
// ========================

export async function getUserCredits(userId: string): Promise<number> {
  const user = await User.findById(userId).select('credits');
  return user?.credits ?? 0;
}

export async function deductCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  referenceId?: mongoose.Types.ObjectId,
  referenceModel?: string,
  session?: mongoose.ClientSession
): Promise<IUser> {
  const opts = session ? { session } : {};

  const user = await User.findById(userId).session(session ?? null);
  if (!user) throw new Error('User not found');

  if (user.credits < amount) {
    throw new InsufficientCreditsError(amount, user.credits);
  }

  const balanceBefore = user.credits;
  user.credits -= amount;
  await user.save(opts);

  await CreditTransaction.create(
    [
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
    ],
    opts
  );

  logger.debug(
    `Credits deducted: user=${userId}, amount=${amount}, balance=${user.credits}`
  );

  return user;
}

export async function addCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  referenceId?: mongoose.Types.ObjectId,
  referenceModel?: string,
  session?: mongoose.ClientSession
): Promise<IUser> {
  const opts = session ? { session } : {};

  const user = await User.findById(userId).session(session ?? null);
  if (!user) throw new Error('User not found');

  const balanceBefore = user.credits;
  user.credits += amount;
  await user.save(opts);

  await CreditTransaction.create(
    [
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
    ],
    opts
  );

  logger.debug(
    `Credits added: user=${userId}, amount=${amount}, balance=${user.credits}`
  );

  return user;
}

export async function refundCredits(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  referenceId?: mongoose.Types.ObjectId
): Promise<IUser> {
  return addCredits(userId, amount, type, description, referenceId);
}

export async function getCreditHistory(
  userId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CreditTransaction.countDocuments({ userId }),
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
