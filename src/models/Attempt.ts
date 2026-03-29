import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnswerResult {
  questionId: mongoose.Types.ObjectId;
  userAnswer: string | string[];
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  pointsEarned: number;
}

export interface IAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: IAnswerResult[];
  score: number;           // 0-100
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds?: number;
  completedAt: Date;
  createdAt: Date;
}

const answerResultSchema = new Schema<IAnswerResult>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    userAnswer: {
      type: Schema.Types.Mixed,
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
  },
  { _id: false }
);

const attemptSchema = new Schema<IAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, quizId: 1 });

export const Attempt: Model<IAttempt> = mongoose.model<IAttempt>('Attempt', attemptSchema);
