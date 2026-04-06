import mongoose, { Document, Model, Schema } from 'mongoose';

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationTrigger {
  PAYMENT_UPDATES = 'payment_updates',
  CERTIFICATES = 'certificates',
  NEW_CONTENT = 'new_content',
  MISSED_DEADLINES = 'missed_deadlines',
  DISCUSSION_REPLIES = 'discussion_replies',
  PROMOTIONS = 'promotions',
  SYSTEM_ALERTS = 'system_alerts',
}

export interface INotificationChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface INotificationTriggerPreferences {
  paymentUpdates: boolean;
  certificates: boolean;
  newContent: boolean;
  missedDeadlines: boolean;
  discussionReplies: boolean;
  promotions: boolean;
  systemAlerts: boolean;
}

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  channels: INotificationChannelPreferences;
  triggers: INotificationTriggerPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreferenceModel extends Model<INotificationPreference> {}

const NotificationChannelPreferencesSchema = new Schema<INotificationChannelPreferences>(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  { _id: false }
);

const NotificationTriggerPreferencesSchema = new Schema<INotificationTriggerPreferences>(
  {
    paymentUpdates: { type: Boolean, default: true },
    certificates: { type: Boolean, default: true },
    newContent: { type: Boolean, default: true },
    missedDeadlines: { type: Boolean, default: true },
    discussionReplies: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    systemAlerts: { type: Boolean, default: true },
  },
  { _id: false }
);

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    channels: {
      type: NotificationChannelPreferencesSchema,
      default: () => ({
        inApp: true,
        email: true,
        sms: false,
        push: false,
      }),
    },
    triggers: {
      type: NotificationTriggerPreferencesSchema,
      default: () => ({
        paymentUpdates: true,
        certificates: true,
        newContent: true,
        missedDeadlines: true,
        discussionReplies: true,
        promotions: false,
        systemAlerts: true,
      }),
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

NotificationPreferenceSchema.index({ userId: 1 }, { unique: true });

const NotificationPreference = mongoose.model<INotificationPreference, INotificationPreferenceModel>(
  'NotificationPreference',
  NotificationPreferenceSchema
);

export default NotificationPreference;
