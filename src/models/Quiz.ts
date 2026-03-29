import mongoose, { Document, Schema, Model } from 'mongoose';
import { QuestionType, DifficultyLevel } from './Question';

export type QuizStatus = 'generating' | 'ready' | 'failed';

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentIds: mongoose.Types.ObjectId[];
  title: string;
  questionTypes: QuestionType[];
  difficulty: DifficultyLevel;
  questionCount: number;
  includeExplanations: boolean;
  status: QuizStatus;
  creditsUsed: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentIds: [
      {
        type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

quizSchema.index({ userId: 1, createdAt: -1 });

export const Quiz: Model<IQuiz> = mongoose.model<IQuiz>('Quiz', quizSchema);
