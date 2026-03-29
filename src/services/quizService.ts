import mongoose from 'mongoose';
import { Quiz, IQuiz } from '../models/Quiz';
import { Question, QuestionType, DifficultyLevel } from '../models/Question';
import { Attempt } from '../models/Attempt';
import { DocumentChunk } from '../models/DocumentChunk';
import { DocumentModel } from '../models/Document';
import { generateQuizQuestions } from '../integrations/gemini';
import { calculateQuizCost, deductCredits, refundCredits } from './creditService';
import { selectRelevantChunks } from '../utils/textChunker';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

export interface CreateQuizInput {
  userId: string;
  documentIds: string[];
  title?: string;
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  questionCount: number;
  includeExplanations: boolean;
}

export async function estimateQuizCost(input: Omit<CreateQuizInput, 'userId' | 'documentIds' | 'title'>) {
  return calculateQuizCost(
    input.questionTypes,
    input.questionCount,
    input.difficulty,
    input.includeExplanations
  );
}

export async function createQuiz(input: CreateQuizInput): Promise<IQuiz> {
  const { userId, documentIds, questionTypes, difficulty, questionCount, includeExplanations } =
    input;

  // Validate documents ownership
  const documents = await DocumentModel.find({
    _id: { $in: documentIds },
    userId,
    status: 'processed',
  });

  if (documents.length !== documentIds.length) {
    throw new BadRequestError(
      'One or more documents are invalid, not processed, or do not belong to you.'
    );
  }

  // Calculate cost
  const costBreakdown = calculateQuizCost(
    questionTypes,
    questionCount,
    difficulty,
    includeExplanations
  );

  // Generate title if not provided
  const title =
    input.title ||
    `Quiz - ${documents.map((d) => d.name).join(', ')} (${difficulty})`;

  // Create quiz record immediately
  const quiz = await Quiz.create({
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
    await deductCredits(
      userId,
      costBreakdown.total,
      'quiz_generation',
      `Generating quiz "${title}" (${questionCount} questions, ${difficulty})`,
      quiz._id,
      'Quiz'
    );
    creditsDeducted = true;

    // Gather content from document chunks
    const chunks = await DocumentChunk.find({
      documentId: { $in: documentIds },
      userId,
    }).sort({ documentId: 1, index: 1 });

    const relevantChunks = selectRelevantChunks(chunks, 30000);
    const content = relevantChunks.map((c) => c.text).join('\n\n---\n\n');

    if (content.trim().length < 100) {
      throw new BadRequestError(
        'Insufficient content in selected documents to generate questions.'
      );
    }

    // Generate questions with Gemini
    const generatedQuestions = await generateQuizQuestions({
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
    const questionDocs = await Question.insertMany(
      generatedQuestions.map((q, idx) => ({
        quizId: quiz._id,
        userId,
        type: q.type,
        difficulty,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        order: idx,
      }))
    );

    // Update quiz as ready
    quiz.status = 'ready';
    quiz.questionCount = questionDocs.length;
    await quiz.save();

    logger.info(
      `Quiz created: ${quiz._id}, questions=${questionDocs.length}, user=${userId}`
    );
    return quiz;
  } catch (error) {
    // Mark as failed
    quiz.status = 'failed';
    quiz.errorMessage = (error as Error).message;
    await quiz.save();

    // Refund credits if deducted
    if (creditsDeducted) {
      await refundCredits(
        userId,
        costBreakdown.total,
        'quiz_generation_refund',
        `Refund for failed quiz generation "${title}"`,
        quiz._id
      );
    }

    logger.error(`Quiz generation failed: ${quiz._id}`, error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getQuizWithQuestions(quizId: string, userId: string): Promise<{ quiz: any; questions: any[] }> {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new NotFoundError('Quiz');
  if (quiz.userId.toString() !== userId) throw new ForbiddenError();

  const questions = await Question.find({ quizId }).sort({ order: 1 }).lean();

  // Remove correct answers for the quiz-taking view
  const sanitizedQuestions = questions.map((q) => {
    const { correctAnswer, explanation, ...rest } = q;
    void correctAnswer;
    void explanation;
    return rest;
  });

  return { quiz, questions: sanitizedQuestions };
}

export async function getQuizForReview(quizId: string, userId: string) {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new NotFoundError('Quiz');
  if (quiz.userId.toString() !== userId) throw new ForbiddenError();

  const questions = await Question.find({ quizId }).sort({ order: 1 }).lean();
  return { quiz, questions };
}

export async function getUserQuizzes(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [quizzes, total] = await Promise.all([
    Quiz.find({ userId, status: 'ready' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments({ userId, status: 'ready' }),
  ]);

  return {
    quizzes,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: { questionId: string; answer: string | string[] }[],
  timeSpentSeconds?: number
) {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundError('Quiz');
  if (quiz.userId.toString() !== userId) throw new ForbiddenError();
  if (quiz.status !== 'ready') throw new BadRequestError('Quiz is not available.');

  const questions = await Question.find({ quizId }).sort({ order: 1 });

  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  let correctCount = 0;
  const answerResults = questions.map((q) => {
    const userAnswer = answerMap.get(q._id.toString()) ?? '';
    const { isCorrect, isPartiallyCorrect } = evaluateAnswer(
      q.type as QuestionType,
      userAnswer,
      q.correctAnswer
    );

    if (isCorrect) correctCount++;

    return {
      questionId: q._id,
      userAnswer,
      isCorrect,
      isPartiallyCorrect,
      pointsEarned: isCorrect ? 1 : 0,
    };
  });

  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const attempt = await Attempt.create({
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

export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt');
  if (attempt.userId.toString() !== userId) throw new ForbiddenError();

  const quiz = await Quiz.findById(attempt.quizId).lean();
  if (!quiz) throw new NotFoundError('Quiz');

  const questions = await Question.find({ quizId: attempt.quizId })
    .sort({ order: 1 })
    .lean();

  return { attempt, quiz, questions };
}

export async function deleteQuiz(quizId: string, userId: string): Promise<void> {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundError('Quiz');
  if (quiz.userId.toString() !== userId) throw new ForbiddenError();

  await Promise.all([
    Question.deleteMany({ quizId: quiz._id }),
    Attempt.deleteMany({ quizId: quiz._id }),
    Quiz.deleteOne({ _id: quiz._id }),
  ]);

  logger.info(`Quiz deleted: ${quizId} by user ${userId}`);
}

export async function getUserAttempts(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [attempts, total] = await Promise.all([
    Attempt.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('quizId', 'title difficulty questionCount')
      .lean(),
    Attempt.countDocuments({ userId }),
  ]);

  return {
    attempts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

function evaluateAnswer(
  type: QuestionType,
  userAnswer: string | string[],
  correctAnswer: string | string[]
): { isCorrect: boolean; isPartiallyCorrect?: boolean } {
  if (type === 'multiple_choice') {
    const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
    const correctSet = new Set(Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]);

    const correct = [...correctSet].every((a) => userSet.has(a)) && userSet.size === correctSet.size;
    const partial =
      !correct &&
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
