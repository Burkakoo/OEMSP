import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationChannel, NotificationTrigger } from './NotificationPreference';

// Enums
export enum NotificationType {
  ENROLLMENT = 'enrollment',
  COURSE_UPDATE = 'course_update',
  QUIZ_GRADED = 'quiz_graded',
  CERTIFICATE_ISSUED = 'certificate_issued',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  DISCUSSION_REPLY = 'discussion_reply',
  NEW_CONTENT = 'new_content',
  DEADLINE_MISSED = 'deadline_missed',
  DEADLINE_REMINDER = 'deadline_reminder',
  SYSTEM = 'system',
}

// Interfaces
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  trigger?: NotificationTrigger;
  isVisibleInApp: boolean;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  updatedAt: Date;
}

// Interface for Notification model with static methods
export interface INotificationModel extends Model<INotification> {
  // Add any static methods here if needed
}

// Main Notification Schema
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(NotificationType),
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
    },
    channels: {
      type: [String],
      enum: {
        values: Object.values(NotificationChannel),
        message: '{VALUE} is not a valid notification channel',
      },
      default: [NotificationChannel.IN_APP],
    },
    trigger: {
      type: String,
      enum: {
        values: Object.values(NotificationTrigger),
        message: '{VALUE} is not a valid notification trigger',
      },
    },
    isVisibleInApp: {
      type: Boolean,
      default: true,
      required: [true, 'Visibility status is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
      required: [true, 'Read status is required'],
    },
    readAt: {
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

// Indexes
// Non-unique index on userId for querying user notifications
NotificationSchema.index({ userId: 1 });

// Non-unique index on isRead for filtering read/unread notifications
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ isVisibleInApp: 1 });

// Descending index on createdAt for sorting (newest first)
NotificationSchema.index({ createdAt: -1 });

// Compound index for efficient queries (userId, isRead, createdAt)
// This supports queries like: "Get all unread notifications for user X, sorted by date"
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isVisibleInApp: 1, createdAt: -1 });

// Pre-save hook to set readAt timestamp when isRead changes to true
NotificationSchema.pre<INotification>('save', function () {
  // If isRead is being set to true and readAt is not set, set it now
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  // If isRead is being set to false, clear readAt
  if (!this.isRead && this.readAt) {
    this.readAt = undefined;
  }
});

// Create and export the model
const Notification = mongoose.model<INotification, INotificationModel>(
  'Notification',
  NotificationSchema
);

export default Notification;
