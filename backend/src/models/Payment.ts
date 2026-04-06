import mongoose, { Schema, Document, Model } from 'mongoose';

// Enums
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  COUPON = 'coupon',
  MOBILE_MONEY = 'mobile_money',
  MPESA = 'mpesa',
  MTN_MOMO = 'mtn_momo',
  AIRTEL_MONEY = 'airtel_money',
  ORANGE_MONEY = 'orange_money',
  TELEBIRR = 'telebirr',
  CBE_BIRR = 'cbe_birr',
  CBE = 'cbe',
  AWASH_BANK = 'awash_bank',
  SIINQEE_BANK = 'siinqee_bank',
}

export enum PurchaseType {
  COURSE = 'course',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'ETB'];

// Ethiopian mobile payment methods that require phone number
export const ETHIOPIAN_MOBILE_PAYMENT_METHODS = [
  PaymentMethod.TELEBIRR,
  PaymentMethod.CBE_BIRR,
];

export const MOBILE_PAYMENT_METHODS = [
  PaymentMethod.MOBILE_MONEY,
  PaymentMethod.MPESA,
  PaymentMethod.MTN_MOMO,
  PaymentMethod.AIRTEL_MONEY,
  PaymentMethod.ORANGE_MONEY,
  ...ETHIOPIAN_MOBILE_PAYMENT_METHODS,
];

// Interfaces
export interface IPaymentMetadata {
  ipAddress: string;
  userAgent: string;
  phoneNumber?: string;
  gatewayResponse?: any;
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  currency: string;
  purchaseType: PurchaseType;
  purchaseReferenceId?: string;
  billingInterval?: BillingInterval;
  referralCode?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  metadata: IPaymentMetadata;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  refundedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

// Interface for Payment model with static methods
export interface IPaymentModel extends Model<IPayment> {
  validateEthiopianPhoneNumber(phoneNumber: string): {
    valid: boolean;
    error?: string;
  };
}

// PaymentMetadata subdocument schema
const PaymentMetadataSchema = new Schema<IPaymentMetadata>(
  {
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
      match: [
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
        'Invalid IP address format',
      ],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+251\d{9}$/, 'Invalid Ethiopian phone number format. Must be +251XXXXXXXXX'],
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

// Main Payment Schema
const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    originalAmount: {
      type: Number,
      required: [true, 'Original amount is required'],
      min: [0, 'Original amount cannot be negative'],
    },
    discountAmount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [0, 'Discount amount cannot be negative'],
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: '{VALUE} is not a supported currency. Supported: USD, EUR, ETB',
      },
    },
    purchaseType: {
      type: String,
      enum: {
        values: Object.values(PurchaseType),
        message: '{VALUE} is not a valid purchase type',
      },
      required: [true, 'Purchase type is required'],
      default: PurchaseType.COURSE,
    },
    purchaseReferenceId: {
      type: String,
      trim: true,
      maxlength: [200, 'Purchase reference ID cannot exceed 200 characters'],
    },
    billingInterval: {
      type: String,
      enum: {
        values: Object.values(BillingInterval),
        message: '{VALUE} is not a valid billing interval',
      },
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Referral code cannot exceed 50 characters'],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PaymentMethod),
        message: '{VALUE} is not a valid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PaymentStatus),
        message: '{VALUE} is not a valid payment status',
      },
      required: [true, 'Payment status is required'],
      default: PaymentStatus.PENDING,
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true,
    },
    metadata: {
      type: PaymentMetadataSchema,
      required: [true, 'Payment metadata is required'],
    },
    completedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters'],
    },
    refundedBy: {
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

// Indexes
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ courseId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true });
PaymentSchema.index({ createdAt: -1 });

// Pre-save validation for Ethiopian mobile payment methods
PaymentSchema.pre<IPayment>('save', function () {
  if (this.originalAmount < this.amount) {
    throw new Error('Original amount cannot be less than final amount');
  }

  if (this.discountAmount !== this.originalAmount - this.amount) {
    throw new Error('Discount amount must equal original amount minus final amount');
  }

  // Check if payment method requires phone number
  if (ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(this.paymentMethod)) {
    if (!this.metadata.phoneNumber) {
      throw new Error(
        `Phone number is required for ${this.paymentMethod} payment method`
      );
    }
  }

  if (this.purchaseType === PurchaseType.SUBSCRIPTION && !this.billingInterval) {
    throw new Error('Billing interval is required for subscription payments');
  }
});

// Static method to validate Ethiopian phone number
PaymentSchema.statics.validateEthiopianPhoneNumber = function (
  phoneNumber: string
): { valid: boolean; error?: string } {
  const ethiopianPhoneRegex = /^\+251\d{9}$/;

  if (!phoneNumber) {
    return {
      valid: false,
      error: 'Phone number is required',
    };
  }

  if (!ethiopianPhoneRegex.test(phoneNumber)) {
    return {
      valid: false,
      error: 'Invalid Ethiopian phone number format. Must be +251XXXXXXXXX',
    };
  }

  return { valid: true };
};

// Create and export the model
const Payment = mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;
