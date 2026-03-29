"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const optionSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
}, { _id: false });
const questionSchema = new mongoose_1.Schema({
    quizId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'short_answer'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    options: [optionSchema],
    correctAnswer: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    explanation: {
        type: String,
    },
    sourceChunkIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'DocumentChunk',
        },
    ],
    order: {
        type: Number,
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});
questionSchema.index({ quizId: 1, order: 1 });
exports.Question = mongoose_1.default.model('Question', questionSchema);
//# sourceMappingURL=Question.js.map