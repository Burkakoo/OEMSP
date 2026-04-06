import mongoose, { Schema, Document, Model } from 'mongoose';
import { DiscountType } from './Course';

export interface ICoupon extends Document {
  courseId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchaseAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponModel extends Model<ICoupon> {}

const CouponSchema = new Schema<ICoupon>(
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
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [32, 'Coupon code cannot exceed 32 characters'],
      match: [/^[A-Z0-9_-]+$/, 'Coupon code can only contain letters, numbers, hyphens, and underscores'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Coupon description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      enum: {
        values: Object.values(DiscountType),
        message: '{VALUE} is not a valid discount type',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0.01, 'Discount value must be greater than 0'],
    },
    minimumPurchaseAmount: {
      type: Number,
      min: [0, 'Minimum purchase amount cannot be negative'],
    },
    maxUses: {
      type: Number,
      min: [1, 'Maximum uses must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    validFrom: {
      type: Date,
    },
    validUntil: {
      type: Date,
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

CouponSchema.pre<ICoupon>('validate', function () {
  if (this.discountType === DiscountType.PERCENTAGE && this.discountValue > 100) {
    throw new Error('Percentage coupon value cannot exceed 100');
  }

  if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
    throw new Error('Coupon start date must be before coupon end date');
  }
});

CouponSchema.index({ courseId: 1, code: 1 }, { unique: true });
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

const Coupon = mongoose.model<ICoupon, ICouponModel>('Coupon', CouponSchema);

export default Coupon;
