export interface PdfExtractionResult {
    text: string;
    pageCount: number;
    info: Record<string, unknown>;
}
export declare function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult>;
export declare function estimateTokenCount(text: string): number;
//# sourceMappingURL=pdfProcessor.d.ts.map