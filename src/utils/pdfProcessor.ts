import pdfParse from 'pdf-parse';
import { logger } from './logger';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  info: Record<string, unknown>;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const data = await pdfParse(buffer, {
      // Disable rendering to avoid issues
      max: 0,
    });

    const text = data.text
      .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
      .replace(/\s{3,}/g, ' ')    // Normalize excessive spaces
      .trim();

    if (!text || text.length < 50) {
      throw new Error(
        'PDF contains no extractable text. It may be a scanned image or protected document.'
      );
    }

    return {
      text,
      pageCount: data.numpages,
      info: data.info as Record<string, unknown>,
    };
  } catch (error) {
    logger.error('PDF extraction error:', error);
    throw error;
  }
}

export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}
