import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CourseCurrency {
  USD = 'USD',
  EUR = 'EUR',
  ETB = 'ETB',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

export enum CourseReviewStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested',
}

// Allowed file types for attachments
export const ALLOWED_FILE_TYPES = [
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
];

// Maximum file size: 50MB in bytes
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Interfaces
export interface IAttachment {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
  isDownloadable: boolean;
}

export interface IResource {
  title: string;
  url: string;
  type: string;
}

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  resources: IResource[];
  attachments: IAttachment[];
  isDripEnabled: boolean;
  dripDelayDays: number;
}

export interface IModule {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  title: string;
  description: string;
  instructorId: mongoose.Types.ObjectId;
  category: string;
  level: CourseLevel;
  price: number;
  currency: CourseCurrency;
  isFree: boolean;
  saleEnabled: boolean;
  saleType?: DiscountType;
  saleValue: number;
  saleStartsAt?: Date;
  saleEndsAt?: Date;
  thumbnail: string;
  modules: IModule[];
  prerequisites: string[];
  learningObjectives: string[];
  isPublished: boolean;
  reviewStatus?: CourseReviewStatus;
  reviewNotes?: string;
  submittedForReviewAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Course model with static methods
export interface ICourseModel extends Model<ICourse> {
  // Add static methods here if needed
}

// Schema definitions

// Attachment subdocument schema
const AttachmentSchema = new Schema<IAttachment>(
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
    isDownloadable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Resource subdocument schema
const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      minlength: [2, 'Resource title must be at least 2 characters'],
      maxlength: [200, 'Resource title cannot exceed 200 characters'],
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
      match: [/^https?:\/\/.*$/, 'Invalid resource URL'],
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
    },
  },
  { _id: false }
);

// Lesson subdocument schema
const LessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [2, 'Lesson title must be at least 2 characters'],
      maxlength: [200, 'Lesson title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Lesson description is required'],
      trim: true,
      minlength: [10, 'Lesson description must be at least 10 characters'],
      maxlength: [2000, 'Lesson description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(LessonType),
        message: '{VALUE} is not a valid lesson type',
      },
      required: [true, 'Lesson type is required'],
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.*$/, 'Invalid video URL'],
    },
    duration: {
      type: Number,
      required: [true, 'Lesson duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
      min: [0, 'Order cannot be negative'],
    },
    resources: {
      type: [ResourceSchema],
      default: [],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    isDripEnabled: {
      type: Boolean,
      default: false,
    },
    dripDelayDays: {
      type: Number,
      default: 0,
      min: [0, 'Drip delay cannot be negative'],
    },
  },
  { _id: true }
);

// Module subdocument schema
const ModuleSchema = new Schema<IModule>(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [2, 'Module title must be at least 2 characters'],
      maxlength: [200, 'Module title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Module description is required'],
      trim: true,
      minlength: [10, 'Module description must be at least 10 characters'],
      maxlength: [2000, 'Module description cannot exceed 2000 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [0, 'Order cannot be negative'],
    },
    lessons: {
      type: [LessonSchema],
      default: [],
    },
  },
  { _id: true }
);

// Main Course Schema
const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [5, 'Course title must be at least 5 characters'],
      maxlength: [200, 'Course title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [50, 'Course description must be at least 50 characters'],
      maxlength: [5000, 'Course description cannot exceed 5000 characters'],
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: Object.values(CourseLevel),
        message: '{VALUE} is not a valid course level',
      },
      required: [true, 'Course level is required'],
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
      max: [99999.99, 'Price cannot exceed 99999.99'],
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      enum: {
        values: Object.values(CourseCurrency),
        message: '{VALUE} is not a supported currency',
      },
      default: CourseCurrency.ETB,
      required: [true, 'Course currency is required'],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    saleEnabled: {
      type: Boolean,
      default: false,
    },
    saleType: {
      type: String,
      enum: {
        values: Object.values(DiscountType),
        message: '{VALUE} is not a valid discount type',
      },
    },
    saleValue: {
      type: Number,
      default: 0,
      min: [0, 'Sale value cannot be negative'],
    },
    saleStartsAt: {
      type: Date,
    },
    saleEndsAt: {
      type: Date,
    },
    thumbnail: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i, 'Invalid thumbnail URL'],
    },
    modules: {
      type: [ModuleSchema],
      default: [],
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    reviewStatus: {
      type: String,
      enum: {
        values: Object.values(CourseReviewStatus),
        message: '{VALUE} is not a valid course review status',
      },
      default: CourseReviewStatus.DRAFT,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
    },
    submittedForReviewAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    enrollmentCount: {
      type: Number,
      default: 0,
      min: [0, 'Enrollment count cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
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

CourseSchema.pre<ICourse>('validate', function () {
  if (this.isFree) {
    this.price = 0;
    this.saleEnabled = false;
    this.saleType = undefined;
    this.saleValue = 0;
    this.saleStartsAt = undefined;
    this.saleEndsAt = undefined;
  }

  if (!this.saleEnabled) {
    this.saleType = undefined;
    this.saleValue = 0;
    this.saleStartsAt = undefined;
    this.saleEndsAt = undefined;
    return;
  }

  if (!this.saleType) {
    throw new Error('Sale type is required when sale pricing is enabled');
  }

  if (!this.saleValue || this.saleValue <= 0) {
    throw new Error('Sale value must be greater than 0 when sale pricing is enabled');
  }

  if (this.saleType === DiscountType.PERCENTAGE && this.saleValue > 100) {
    throw new Error('Percentage sale value cannot exceed 100');
  }

  if (this.saleStartsAt && this.saleEndsAt && this.saleStartsAt > this.saleEndsAt) {
    throw new Error('Sale start date must be before sale end date');
  }
});

// Indexes
CourseSchema.index({ instructorId: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ reviewStatus: 1 });
CourseSchema.index({ rating: -1 });
CourseSchema.index({ category: 1, level: 1, isPublished: 1 });

// Compound unique index: title must be unique per instructor
CourseSchema.index({ instructorId: 1, title: 1 }, { unique: true });

// Create and export the model
const Course = mongoose.model<ICourse, ICourseModel>('Course', CourseSchema);

export default Course;
