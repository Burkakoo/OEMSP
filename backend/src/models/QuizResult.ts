import mongoose, { Schema, Document, Model } from 'mongoose';

// Interfaces
export interface IQuizAnswer {
  questionId: mongoose.Types.ObjectId;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface IQuizResult extends Document {
  studentId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  submittedAt: Date;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for QuizResult model with static methods
export interface IQuizResultModel extends Model<IQuizResult> {
  // Add static methods here if needed
}

// QuizAnswer subdocument schema
const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Question ID is required'],
    },
    studentAnswer: {
      type: Schema.Types.Mixed,
      required: [true, 'Student answer is required'],
      validate: {
        validator: function (answer: string | string[]) {
          // Answer can be a string or array of strings
          if (Array.isArray(answer)) {
            return answer.length > 0 && answer.every(a => typeof a === 'string');
          }
          return typeof answer === 'string' && answer.length > 0;
        },
        message: 'Student answer must be a non-empty string or array of strings',
      },
    },
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect status is required'],
    },
    pointsEarned: {
      type: Number,
      required: [true, 'Points earned is required'],
      min: [0, 'Points earned cannot be negative'],
    },
  },
  { _id: false }
);

// Main QuizResult Schema
const QuizResultSchema = new Schema<IQuizResult>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      validate: {
        validator: async function (studentId: mongoose.Types.ObjectId) {
          // Check if user exists and has student role
          const User = mongoose.model('User');
          const user = await User.findById(studentId);
          return user && user.role === 'student';
        },
        message: 'Student ID must reference a valid user with student role',
      },
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
    },
    answers: {
      type: [QuizAnswerSchema],
      required: [true, 'Answers are required'],
      validate: {
        validator: function (answers: IQuizAnswer[]) {
          return answers.length >= 1;
        },
        message: 'Quiz result must have at least 1 answer',
      },
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    passed: {
      type: Boolean,
      required: [true, 'Passed status is required'],
    },
    attemptNumber: {
      type: Number,
      required: [true, 'Attempt number is required'],
      min: [1, 'Attempt number must be at least 1'],
    },
    submittedAt: {
      type: Date,
      required: [true, 'Submitted at timestamp is required'],
      default: Date.now,
    },
    gradedAt: {
      type: Date,
      required: [true, 'Graded at timestamp is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
QuizResultSchema.index({ studentId: 1 });
QuizResultSchema.index({ quizId: 1 });
QuizResultSchema.index({ studentId: 1, quizId: 1 });

// Create and export the model
const QuizResult = mongoose.model<IQuizResult, IQuizResultModel>(
  'QuizResult',
  QuizResultSchema
);

export default QuizResult;
