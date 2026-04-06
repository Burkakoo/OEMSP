import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  MULTI_SELECT = 'multi_select',
  SHORT_ANSWER = 'short_answer',
}

// Interfaces
export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  questionBankItemId?: mongoose.Types.ObjectId;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  courseId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: IQuestion[];
  duration: number;
  passingScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Quiz model with static methods
export interface IQuizModel extends Model<IQuiz> {
  // Add static methods here if needed
}

// Question subdocument schema
const QuestionSchema = new Schema<IQuestion>(
  {
    questionBankItemId: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionBankItem',
    },
    type: {
      type: String,
      enum: {
        values: Object.values(QuestionType),
        message: '{VALUE} is not a valid question type',
      },
      required: [true, 'Question type is required'],
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question text must be at least 5 characters'],
      maxlength: [1000, 'Question text cannot exceed 1000 characters'],
    },
    options: {
      type: [String],
      default: [],
      validate: {
        validator: function (options: string[]) {
          const question = this as unknown as IQuestion;
          // For multiple choice questions, require 2-6 options
          if (question.type === QuestionType.MULTIPLE_CHOICE) {
            return options.length >= 2 && options.length <= 6;
          }
          // For true/false, options should be empty or exactly 2
          if (question.type === QuestionType.TRUE_FALSE) {
            return options.length === 0 || options.length === 2;
          }
          // For multi-select, require 2-6 options
          if (question.type === QuestionType.MULTI_SELECT) {
            return options.length >= 2 && options.length <= 6;
          }
          // For short answer, options should be empty
          if (question.type === QuestionType.SHORT_ANSWER) {
            return options.length === 0;
          }
          return true;
        },
        message: 'Invalid number of options for question type',
      },
    },
    correctAnswer: {
      type: Schema.Types.Mixed,
      required: [true, 'Correct answer is required'],
      validate: {
        validator: function (answer: string | string[]) {
          const question = this as unknown as IQuestion;
          // For multi-select, correctAnswer should be an array
          if (question.type === QuestionType.MULTI_SELECT) {
            return Array.isArray(answer) && answer.length > 0;
          }
          // For other types, correctAnswer should be a string
          return typeof answer === 'string' && answer.length > 0;
        },
        message: 'Invalid correct answer format for question type',
      },
    },
    points: {
      type: Number,
      required: [true, 'Question points are required'],
      min: [0.1, 'Points must be greater than 0'],
      max: [1000, 'Points cannot exceed 1000'],
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
    },
  },
  { _id: true }
);

// Main Quiz Schema
const QuizSchema = new Schema<IQuiz>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Module ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [5, 'Quiz title must be at least 5 characters'],
      maxlength: [200, 'Quiz title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Quiz description is required'],
      trim: true,
      minlength: [10, 'Quiz description must be at least 10 characters'],
      maxlength: [2000, 'Quiz description cannot exceed 2000 characters'],
    },
    questions: {
      type: [QuestionSchema],
      default: [],
      validate: {
        validator: function (questions: IQuestion[]) {
          return questions.length >= 1;
        },
        message: 'Quiz must have at least 1 question',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Quiz duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [300, 'Duration cannot exceed 300 minutes'],
    },
    passingScore: {
      type: Number,
      required: [true, 'Passing score is required'],
      min: [0, 'Passing score cannot be less than 0'],
      max: [100, 'Passing score cannot exceed 100'],
    },
    maxAttempts: {
      type: Number,
      required: [true, 'Maximum attempts is required'],
      min: [1, 'Maximum attempts must be at least 1'],
      max: [10, 'Maximum attempts cannot exceed 10'],
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
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
QuizSchema.index({ courseId: 1 });
QuizSchema.index({ moduleId: 1 });

// Create and export the model
const Quiz = mongoose.model<IQuiz, IQuizModel>('Quiz', QuizSchema);

export default Quiz;
