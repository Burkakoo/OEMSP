import mongoose, { Schema, Document, Model } from 'mongoose';
import { QuestionType } from './Quiz';

export interface IQuestionBankItem extends Document {
  courseId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionBankItemModel extends Model<IQuestionBankItem> {}

const QuestionBankItemSchema = new Schema<IQuestionBankItem>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
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
    },
    correctAnswer: {
      type: Schema.Types.Mixed,
      required: [true, 'Correct answer is required'],
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
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
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

QuestionBankItemSchema.index({ courseId: 1, createdAt: -1 });
QuestionBankItemSchema.index({ courseId: 1, type: 1, isActive: 1 });
QuestionBankItemSchema.index({ courseId: 1, tags: 1 });

const QuestionBankItem = mongoose.model<IQuestionBankItem, IQuestionBankItemModel>(
  'QuestionBankItem',
  QuestionBankItemSchema
);

export default QuestionBankItem;
