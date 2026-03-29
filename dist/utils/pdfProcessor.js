"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPdf = extractTextFromPdf;
exports.estimateTokenCount = estimateTokenCount;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const logger_1 = require("./logger");
async function extractTextFromPdf(buffer) {
    try {
        const data = await (0, pdf_parse_1.default)(buffer, {
            // Disable rendering to avoid issues
            max: 0,
        });
        const text = data.text
            .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
            .replace(/\s{3,}/g, ' ') // Normalize excessive spaces
            .trim();
        if (!text || text.length < 50) {
            throw new Error('PDF contains no extractable text. It may be a scanned image or protected document.');
        }
        return {
            text,
            pageCount: data.numpages,
            info: data.info,
        };
    }
    catch (error) {
        logger_1.logger.error('PDF extraction error:', error);
        throw error;
    }
}
function estimateTokenCount(text) {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
}
//# sourceMappingURL=pdfProcessor.js.map