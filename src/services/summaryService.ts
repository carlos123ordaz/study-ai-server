import { Summary, ISummary } from '../models/Summary';
import { DocumentChunk } from '../models/DocumentChunk';
import { DocumentModel } from '../models/Document';
import { generateSummary } from '../integrations/gemini';
import { SUMMARY_COST, deductCredits, refundCredits } from './creditService';
import { selectRelevantChunks } from '../utils/textChunker';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

export async function createSummary(userId: string, documentId: string): Promise<ISummary> {
  const document = await DocumentModel.findOne({
    _id: documentId,
    userId,
    status: 'processed',
  });

  if (!document) {
    throw new BadRequestError('Document not found, not processed, or does not belong to you.');
  }

  const title = `Resumen — ${document.name}`;

  const summary = await Summary.create({
    userId,
    documentId,
    title,
    content: { overview: '', sections: [], keyTerms: [] },
    status: 'generating',
    creditsUsed: SUMMARY_COST,
  });

  let creditsDeducted = false;

  try {
    await deductCredits(
      userId,
      SUMMARY_COST,
      'summary_generation',
      `Generating summary for "${document.name}"`,
      summary._id,
      'Summary'
    );
    creditsDeducted = true;

    const chunks = await DocumentChunk.find({ documentId, userId }).sort({ index: 1 });
    const relevantChunks = selectRelevantChunks(chunks, 30000);
    const content = relevantChunks.map((c) => c.text).join('\n\n---\n\n');

    if (content.trim().length < 100) {
      throw new BadRequestError('Insufficient content to generate summary.');
    }

    const generated = await generateSummary(content);

    summary.content = generated;
    summary.status = 'ready';
    await summary.save();

    logger.info(`Summary created: ${summary._id}, user=${userId}`);
    return summary;
  } catch (error) {
    summary.status = 'failed';
    summary.errorMessage = (error as Error).message;
    await summary.save();

    if (creditsDeducted) {
      await refundCredits(
        userId,
        SUMMARY_COST,
        'summary_generation_refund',
        `Refund for failed summary generation "${document.name}"`,
        summary._id
      );
    }

    logger.error(`Summary generation failed: ${summary._id}`, error);
    throw error;
  }
}

export async function getUserSummaries(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [summaries, total] = await Promise.all([
    Summary.find({ userId, status: 'ready' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content.sections -content.keyTerms')
      .lean(),
    Summary.countDocuments({ userId, status: 'ready' }),
  ]);

  return {
    summaries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getSummary(summaryId: string, userId: string): Promise<ISummary> {
  const summary = await Summary.findById(summaryId).lean();
  if (!summary) throw new NotFoundError('Summary');
  if (summary.userId.toString() !== userId) throw new ForbiddenError();
  return summary as unknown as ISummary;
}

export async function deleteSummary(summaryId: string, userId: string): Promise<void> {
  const summary = await Summary.findById(summaryId);
  if (!summary) throw new NotFoundError('Summary');
  if (summary.userId.toString() !== userId) throw new ForbiddenError();
  await Summary.deleteOne({ _id: summaryId });
  logger.info(`Summary deleted: ${summaryId} by user ${userId}`);
}
