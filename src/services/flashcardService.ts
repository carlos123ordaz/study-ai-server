import { FlashcardSet, IFlashcardSet } from '../models/FlashcardSet';
import { DocumentChunk } from '../models/DocumentChunk';
import { DocumentModel } from '../models/Document';
import { generateFlashcards } from '../integrations/gemini';
import { FLASHCARD_COST, deductCredits, refundCredits } from './creditService';
import { selectRelevantChunks } from '../utils/textChunker';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

export async function createFlashcardSet(
  userId: string,
  documentId: string,
  cardCount = 20
): Promise<IFlashcardSet> {
  const document = await DocumentModel.findOne({
    _id: documentId,
    userId,
    status: 'processed',
  });

  if (!document) {
    throw new BadRequestError('Document not found, not processed, or does not belong to you.');
  }

  const title = `Flashcards — ${document.name}`;

  const set = await FlashcardSet.create({
    userId,
    documentId,
    title,
    cards: [],
    cardCount: 0,
    status: 'generating',
    creditsUsed: FLASHCARD_COST,
  });

  let creditsDeducted = false;

  try {
    await deductCredits(
      userId,
      FLASHCARD_COST,
      'flashcard_generation',
      `Generating flashcards for "${document.name}"`,
      set._id,
      'FlashcardSet'
    );
    creditsDeducted = true;

    const chunks = await DocumentChunk.find({ documentId, userId }).sort({ index: 1 });
    const relevantChunks = selectRelevantChunks(chunks, 25000);
    const content = relevantChunks.map((c) => c.text).join('\n\n---\n\n');

    if (content.trim().length < 100) {
      throw new BadRequestError('Insufficient content to generate flashcards.');
    }

    const generated = await generateFlashcards(content, cardCount);

    if (generated.length === 0) {
      throw new Error('AI failed to generate valid flashcards.');
    }

    set.cards = generated;
    set.cardCount = generated.length;
    set.status = 'ready';
    await set.save();

    logger.info(`FlashcardSet created: ${set._id}, cards=${generated.length}, user=${userId}`);
    return set;
  } catch (error) {
    set.status = 'failed';
    set.errorMessage = (error as Error).message;
    await set.save();

    if (creditsDeducted) {
      await refundCredits(
        userId,
        FLASHCARD_COST,
        'flashcard_generation_refund',
        `Refund for failed flashcard generation "${document.name}"`,
        set._id
      );
    }

    logger.error(`FlashcardSet generation failed: ${set._id}`, error);
    throw error;
  }
}

export async function getUserFlashcardSets(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [sets, total] = await Promise.all([
    FlashcardSet.find({ userId, status: 'ready' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-cards')
      .lean(),
    FlashcardSet.countDocuments({ userId, status: 'ready' }),
  ]);

  return {
    sets,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getFlashcardSet(setId: string, userId: string): Promise<IFlashcardSet> {
  const set = await FlashcardSet.findById(setId).lean();
  if (!set) throw new NotFoundError('FlashcardSet');
  if (set.userId.toString() !== userId) throw new ForbiddenError();
  return set as unknown as IFlashcardSet;
}

export async function deleteFlashcardSet(setId: string, userId: string): Promise<void> {
  const set = await FlashcardSet.findById(setId);
  if (!set) throw new NotFoundError('FlashcardSet');
  if (set.userId.toString() !== userId) throw new ForbiddenError();
  await FlashcardSet.deleteOne({ _id: setId });
  logger.info(`FlashcardSet deleted: ${setId} by user ${userId}`);
}
