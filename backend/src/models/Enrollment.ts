import mongoose, { Schema, Document, Model } from 'mongoose';

// Interfaces
export interface ILessonProgress {
  lessonId: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number;
}

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  progress: ILessonProgress[];
  completionPercentage: number;
  isCompleted: boolean;
  completedAt?: Date;
  certificateId?: mongoose.Types.ObjectId;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Enrollment model with static methods
export interface IEnrollmentModel extends Model<IEnrollment> {
  // Add static methods here if needed
}

// LessonProgress subdocument schema
const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Lesson ID is required'],
    },
    completed: {
      type: Boolean,
      required: [true, 'Completed status is required'],
      default: false,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number,
      required: [true, 'Time spent is required'],
      default: 0,
      min: [0, 'Time spent cannot be negative'],
    },
  },
  { _id: false }
);

// Main Enrollment Schema
const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment ID is required'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Enrolled at timestamp is required'],
    },
    progress: {
      type: [LessonProgressSchema],
      default: [],
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Completion percentage cannot be less than 0'],
      max: [100, 'Completion percentage cannot exceed 100'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Last accessed at timestamp is required'],
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
// Compound unique index to prevent duplicate enrollments
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Non-unique indexes for queries
EnrollmentSchema.index({ studentId: 1 });
EnrollmentSchema.index({ courseId: 1 });
EnrollmentSchema.index({ isCompleted: 1 });

// Create and export the model
const Enrollment = mongoose.model<IEnrollment, IEnrollmentModel>(
  'Enrollment',
  EnrollmentSchema
);

export default Enrollment;
