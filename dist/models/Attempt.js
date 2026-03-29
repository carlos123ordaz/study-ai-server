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
exports.Attempt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const answerResultSchema = new mongoose_1.Schema({
    questionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    userAnswer: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    isPartiallyCorrect: {
        type: Boolean,
    },
    pointsEarned: {
        type: Number,
        default: 0,
    },
}, { _id: false });
const attemptSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    quizId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true,
    },
    answers: [answerResultSchema],
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    correctCount: {
        type: Number,
        required: true,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    timeSpentSeconds: {
        type: Number,
    },
    completedAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
});
attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, quizId: 1 });
exports.Attempt = mongoose_1.default.model('Attempt', attemptSchema);
//# sourceMappingURL=Attempt.js.map