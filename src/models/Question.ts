import mongoose, { Document, Schema, Model } from 'mongoose';

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: QuestionType;
  difficulty: DifficultyLevel;
  text: string;
  options?: IOption[];
  correctAnswer: string | string[];
  explanation?: string;
  sourceChunkIds?: mongoose.Types.ObjectId[];
  order: number;
  createdAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
      required: true,
    },
    explanation: {
      type: String,
    },
    sourceChunkIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DocumentChunk',
      },
    ],
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

questionSchema.index({ quizId: 1, order: 1 });

export const Question: Model<IQuestion> = mongoose.model<IQuestion>(
  'Question',
  questionSchema
);
