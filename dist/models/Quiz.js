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
exports.Quiz = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const quizSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    documentIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
        },
    ],
    title: {
        type: String,
        required: true,
        trim: true,
    },
    questionTypes: [
        {
            type: String,
            enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'short_answer'],
        },
    ],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
    },
    questionCount: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
    },
    includeExplanations: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['generating', 'ready', 'failed'],
        default: 'generating',
        index: true,
    },
    creditsUsed: {
        type: Number,
        default: 0,
    },
    errorMessage: {
        type: String,
    },
}, {
    timestamps: true,
    versionKey: false,
});
quizSchema.index({ userId: 1, createdAt: -1 });
exports.Quiz = mongoose_1.default.model('Quiz', quizSchema);
//# sourceMappingURL=Quiz.js.map