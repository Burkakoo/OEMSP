import mongoose, { Document, Model, Schema } from 'mongoose';

export type BillingIntervalSetting = 'monthly' | 'yearly';
export type RevenuePayoutSchedule = 'weekly' | 'monthly';

export interface IPlatformSettings extends Document {
  key: string;
  payment: {
    enabledMethods: string[];
    supportedBillingIntervals: BillingIntervalSetting[];
    allowSubscriptions: boolean;
    allowBundles: boolean;
    allowRefunds: boolean;
    allowAffiliates: boolean;
    defaultCurrency: string;
  };
  notifications: {
    defaultChannels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    availableTriggers: string[];
    missedDeadlineReminderHours: number;
  };
  moderation: {
    allowUserDeactivation: boolean;
    requireInstructorApproval: boolean;
    requireCourseReviewBeforePublish: boolean;
    auditRetentionDays: number;
  };
  certificates: {
    includeSkills: boolean;
    publicVerificationBaseUrl?: string;
  };
  revenue: {
    platformFeePercentage: number;
    payoutSchedule: RevenuePayoutSchedule;
    enableReporting: boolean;
  };
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformSettingsModel extends Model<IPlatformSettings> {}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
      trim: true,
    },
    payment: {
      enabledMethods: {
        type: [String],
        default: ['credit_card', 'debit_card', 'paypal', 'mobile_money', 'telebirr', 'cbe_birr'],
      },
      supportedBillingIntervals: {
        type: [String],
        enum: ['monthly', 'yearly'],
        default: ['monthly', 'yearly'],
      },
      allowSubscriptions: { type: Boolean, default: true },
      allowBundles: { type: Boolean, default: true },
      allowRefunds: { type: Boolean, default: true },
      allowAffiliates: { type: Boolean, default: true },
      defaultCurrency: { type: String, default: 'ETB', uppercase: true, trim: true },
    },
    notifications: {
      defaultChannels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
      },
      availableTriggers: {
        type: [String],
        default: [
          'payment_updates',
          'certificates',
          'new_content',
          'missed_deadlines',
          'discussion_replies',
          'promotions',
          'system_alerts',
        ],
      },
      missedDeadlineReminderHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168,
      },
    },
    moderation: {
      allowUserDeactivation: { type: Boolean, default: true },
      requireInstructorApproval: { type: Boolean, default: true },
      requireCourseReviewBeforePublish: { type: Boolean, default: true },
      auditRetentionDays: { type: Number, default: 365, min: 30, max: 3650 },
    },
    certificates: {
      includeSkills: { type: Boolean, default: true },
      publicVerificationBaseUrl: {
        type: String,
        trim: true,
      },
    },
    revenue: {
      platformFeePercentage: { type: Number, default: 10, min: 0, max: 100 },
      payoutSchedule: {
        type: String,
        enum: ['weekly', 'monthly'],
        default: 'monthly',
      },
      enableReporting: { type: Boolean, default: true },
    },
    updatedBy: {
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

PlatformSettingsSchema.index({ key: 1 }, { unique: true });

const PlatformSettings = mongoose.model<IPlatformSettings, IPlatformSettingsModel>(
  'PlatformSettings',
  PlatformSettingsSchema
);

export default PlatformSettings;
