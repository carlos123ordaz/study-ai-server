"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
exports.selectRelevantChunks = selectRelevantChunks;
function chunkText(text, options = {}) {
    const { maxChunkSize = 3000, overlapSize = 200, minChunkSize = 100 } = options;
    const chunks = [];
    let position = 0;
    let index = 0;
    while (position < text.length) {
        const end = Math.min(position + maxChunkSize, text.length);
        let chunkEnd = end;
        // Try to break at a paragraph or sentence boundary
        if (end < text.length) {
            const doubleNewline = text.lastIndexOf('\n\n', end);
            const singleNewline = text.lastIndexOf('\n', end);
            const period = text.lastIndexOf('. ', end);
            if (doubleNewline > position + minChunkSize) {
                chunkEnd = doubleNewline + 2;
            }
            else if (singleNewline > position + minChunkSize) {
                chunkEnd = singleNewline + 1;
            }
            else if (period > position + minChunkSize) {
                chunkEnd = period + 2;
            }
        }
        const chunkText = text.slice(position, chunkEnd).trim();
        if (chunkText.length >= minChunkSize) {
            chunks.push({
                index,
                text: chunkText,
                tokenEstimate: Math.ceil(chunkText.length / 4),
                charStart: position,
                charEnd: chunkEnd,
            });
            index++;
        }
        // Move forward with overlap
        position = chunkEnd - overlapSize;
        if (position <= (chunks[chunks.length - 1]?.charStart ?? 0)) {
            position = chunkEnd; // Avoid infinite loop
        }
    }
    return chunks;
}
function selectRelevantChunks(chunks, maxTotalTokens = 30000) {
    let totalTokens = 0;
    const selected = [];
    for (const chunk of chunks) {
        if (totalTokens + chunk.tokenEstimate > maxTotalTokens)
            break;
        selected.push(chunk);
        totalTokens += chunk.tokenEstimate;
    }
    return selected;
}
//# sourceMappingURL=textChunker.js.map