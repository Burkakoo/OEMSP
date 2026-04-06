import mongoose, { Document, Model, Schema } from 'mongoose';
import { BillingInterval } from './Payment';
import { CourseCurrency } from './Course';

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: CourseCurrency;
  billingInterval: BillingInterval;
  courseIds: mongoose.Types.ObjectId[];
  includesAllPublishedCourses: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlanModel extends Model<ISubscriptionPlan> {}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
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
      match: [/^[a-z0-9-]+$/, 'Plan slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
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
    billingInterval: {
      type: String,
      enum: Object.values(BillingInterval),
      required: true,
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    includesAllPublishedCourses: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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

SubscriptionPlanSchema.index({ slug: 1 }, { unique: true });
SubscriptionPlanSchema.index({ billingInterval: 1, isActive: 1 });

SubscriptionPlanSchema.pre<ISubscriptionPlan>('validate', function () {
  if (!this.includesAllPublishedCourses && this.courseIds.length === 0) {
    throw new Error(
      'Subscription plan must include at least one course or enable all published courses'
    );
  }
});

const SubscriptionPlan = mongoose.model<ISubscriptionPlan, ISubscriptionPlanModel>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);

export default SubscriptionPlan;
