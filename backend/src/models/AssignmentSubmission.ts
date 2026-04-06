import mongoose, { Schema, Document, Model } from 'mongoose';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './Course';

export enum AssignmentSubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
}

export interface IAssignmentAttachment {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

export interface IAssignmentSubmission extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  submissionText: string;
  attachments: IAssignmentAttachment[];
  status: AssignmentSubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentSubmissionModel extends Model<IAssignmentSubmission> {
  // Add static methods here if needed.
}

const AssignmentAttachmentSchema = new Schema<IAssignmentAttachment>(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      lowercase: true,
      enum: {
        values: ALLOWED_FILE_TYPES,
        message: '{VALUE} is not a supported file type',
      },
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0'],
      max: [MAX_FILE_SIZE, `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
      match: [/^https?:\/\/.*$/, 'Invalid file URL'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
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
    moduleId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Module ID is required'],
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Lesson ID is required'],
    },
    submissionText: {
      type: String,
      trim: true,
      maxlength: [10000, 'Submission text cannot exceed 10000 characters'],
      default: '',
    },
    attachments: {
      type: [AssignmentAttachmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(AssignmentSubmissionStatus),
        message: '{VALUE} is not a valid assignment submission status',
      },
      default: AssignmentSubmissionStatus.SUBMITTED,
      required: [true, 'Submission status is required'],
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot exceed 100'],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [5000, 'Feedback cannot exceed 5000 characters'],
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Submitted at timestamp is required'],
    },
    gradedAt: {
      type: Date,
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

AssignmentSubmissionSchema.index(
  { studentId: 1, courseId: 1, lessonId: 1 },
  { unique: true, name: 'unique_student_assignment_submission' }
);
AssignmentSubmissionSchema.index({ courseId: 1, status: 1, submittedAt: -1 });
AssignmentSubmissionSchema.index({ lessonId: 1, submittedAt: -1 });
AssignmentSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

const AssignmentSubmission = mongoose.model<IAssignmentSubmission, IAssignmentSubmissionModel>(
  'AssignmentSubmission',
  AssignmentSubmissionSchema
);

export default AssignmentSubmission;
