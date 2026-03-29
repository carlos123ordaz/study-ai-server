export interface TextChunk {
    index: number;
    text: string;
    tokenEstimate: number;
    charStart: number;
    charEnd: number;
}
interface ChunkOptions {
    maxChunkSize?: number;
    overlapSize?: number;
    minChunkSize?: number;
}
export declare function chunkText(text: string, options?: ChunkOptions): TextChunk[];
export declare function selectRelevantChunks(chunks: TextChunk[], maxTotalTokens?: number): TextChunk[];
export {};
//# sourceMappingURL=textChunker.d.ts.map