import mongoose, { Document, Model, Schema } from 'mongoose';
import { CourseCurrency } from './Course';

export interface ICourseBundle extends Document {
  title: string;
  slug: string;
  description: string;
  courseIds: mongoose.Types.ObjectId[];
  price: number;
  currency: CourseCurrency;
  isActive: boolean;
  thumbnail?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseBundleModel extends Model<ICourseBundle> {}

const CourseBundleSchema = new Schema<ICourseBundle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Bundle slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: Object.values(CourseCurrency),
      default: CourseCurrency.ETB,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

CourseBundleSchema.index({ slug: 1 }, { unique: true });
CourseBundleSchema.index({ isActive: 1, createdAt: -1 });

const CourseBundle = mongoose.model<ICourseBundle, ICourseBundleModel>(
  'CourseBundle',
  CourseBundleSchema
);

export default CourseBundle;
