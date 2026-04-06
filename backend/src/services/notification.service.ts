import mongoose from 'mongoose';
import Notification, { INotification, NotificationType } from '../models/Notification';
import NotificationPreference, {
  INotificationPreference,
  INotificationTriggerPreferences,
  NotificationChannel,
  NotificationTrigger,
} from '../models/NotificationPreference';
import User from '../models/User';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';
import { sendEmail, sendTemplateEmail } from './email.service';

const CACHE_TTL = 300; // 5 minutes

type NotificationPreferenceUpdate = {
  channels?: Partial<INotificationPreference['channels']>;
  triggers?: Partial<INotificationPreference['triggers']>;
};

const preferenceKeyByTrigger: Record<NotificationTrigger, keyof INotificationTriggerPreferences> = {
  [NotificationTrigger.PAYMENT_UPDATES]: 'paymentUpdates',
  [NotificationTrigger.CERTIFICATES]: 'certificates',
  [NotificationTrigger.NEW_CONTENT]: 'newContent',
  [NotificationTrigger.MISSED_DEADLINES]: 'missedDeadlines',
  [NotificationTrigger.DISCUSSION_REPLIES]: 'discussionReplies',
  [NotificationTrigger.PROMOTIONS]: 'promotions',
  [NotificationTrigger.SYSTEM_ALERTS]: 'systemAlerts',
};

const notificationTypeToTrigger = (type: NotificationType): NotificationTrigger => {
  switch (type) {
    case NotificationType.PAYMENT_SUCCESS:
    case NotificationType.PAYMENT_FAILED:
    case NotificationType.PAYMENT_REFUNDED:
      return NotificationTrigger.PAYMENT_UPDATES;
    case NotificationType.CERTIFICATE_ISSUED:
      return NotificationTrigger.CERTIFICATES;
    case NotificationType.COURSE_UPDATE:
    case NotificationType.NEW_CONTENT:
      return NotificationTrigger.NEW_CONTENT;
    case NotificationType.DISCUSSION_REPLY:
      return NotificationTrigger.DISCUSSION_REPLIES;
    case NotificationType.DEADLINE_MISSED:
    case NotificationType.DEADLINE_REMINDER:
      return NotificationTrigger.MISSED_DEADLINES;
    default:
      return NotificationTrigger.SYSTEM_ALERTS;
  }
};

const getOrCreatePreferences = async (
  userId: string
): Promise<INotificationPreference> => {
  return NotificationPreference.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $setOnInsert: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const isTriggerEnabled = (
  preferences: INotificationPreference,
  trigger: NotificationTrigger
): boolean => {
  const key = preferenceKeyByTrigger[trigger];
  return Boolean(preferences.triggers[key]);
};

const invalidateNotificationCaches = async (userId: string): Promise<void> => {
  await deleteCache(`notifications:user:${userId}`);
};

const deliverNotificationChannels = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  data?: any;
}): Promise<void> => {
  const user = await User.findById(params.userId).select('email firstName lastName');
  if (!user) {
    return;
  }

  if (params.channels.includes(NotificationChannel.EMAIL) && user.email) {
    try {
      switch (params.type) {
        case NotificationType.CERTIFICATE_ISSUED:
          await sendTemplateEmail(user.email, 'certificateIssued', {
            studentName: `${user.firstName} ${user.lastName}`.trim(),
            courseTitle: params.data?.courseTitle || 'your course',
            certificateUrl: params.data?.certificateUrl || params.data?.publicVerificationUrl || '#',
          });
          break;
        case NotificationType.PAYMENT_SUCCESS:
          await sendTemplateEmail(user.email, 'paymentSuccess', {
            studentName: `${user.firstName} ${user.lastName}`.trim(),
            courseTitle: params.data?.courseTitle || 'your course',
            amount: params.data?.amount || 0,
            currency: params.data?.currency || 'ETB',
          });
          break;
        case NotificationType.PAYMENT_FAILED:
          await sendTemplateEmail(user.email, 'paymentFailed', {
            studentName: `${user.firstName} ${user.lastName}`.trim(),
            courseTitle: params.data?.courseTitle || 'your course',
            reason: params.data?.reason || 'Payment could not be processed',
          });
          break;
        default:
          await sendEmail({
            to: user.email,
            subject: params.title,
            html: `<p>${params.message}</p>`,
          });
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  if (params.channels.includes(NotificationChannel.SMS)) {
    console.log('SMS notification queued (provider integration pending):', {
      userId: params.userId,
      title: params.title,
    });
  }

  if (params.channels.includes(NotificationChannel.PUSH)) {
    console.log('Push notification queued (provider integration pending):', {
      userId: params.userId,
      title: params.title,
    });
  }
};

/**
 * Notification Service
 * Handles notification creation, retrieval, and management
 */

/**
 * Create a new notification
 */
export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels?: NotificationChannel[];
  trigger?: NotificationTrigger;
  isVisibleInApp?: boolean;
}): Promise<INotification> => {
  if (!mongoose.Types.ObjectId.isValid(data.userId)) {
    throw new Error('Invalid user ID');
  }

  const notification = await Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data,
    channels: data.channels || [NotificationChannel.IN_APP],
    trigger: data.trigger,
    isVisibleInApp: data.isVisibleInApp ?? true,
  });

  // Invalidate user's notification cache
  await invalidateNotificationCaches(data.userId);

  return notification;
};

export const createTriggeredNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  trigger?: NotificationTrigger;
}): Promise<INotification | null> => {
  if (!mongoose.Types.ObjectId.isValid(data.userId)) {
    throw new Error('Invalid user ID');
  }

  const trigger = data.trigger || notificationTypeToTrigger(data.type);
  const preferences = await getOrCreatePreferences(data.userId);

  if (!isTriggerEnabled(preferences, trigger)) {
    return null;
  }

  const channels: NotificationChannel[] = [];
  if (preferences.channels.inApp) channels.push(NotificationChannel.IN_APP);
  if (preferences.channels.email) channels.push(NotificationChannel.EMAIL);
  if (preferences.channels.sms) channels.push(NotificationChannel.SMS);
  if (preferences.channels.push) channels.push(NotificationChannel.PUSH);

  if (channels.length === 0) {
    return null;
  }

  const notification = await createNotification({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data,
    channels,
    trigger,
    isVisibleInApp: channels.includes(NotificationChannel.IN_APP),
  });

  await deliverNotificationChannels({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    channels,
    data: data.data,
  });

  return notification;
};

export const getNotificationPreferences = async (
  userId: string
): Promise<INotificationPreference> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  return getOrCreatePreferences(userId);
};

export const updateNotificationPreferences = async (
  userId: string,
  updates: NotificationPreferenceUpdate
): Promise<INotificationPreference> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const preferences = await getOrCreatePreferences(userId);

  if (updates.channels) {
    preferences.channels = {
      ...preferences.channels,
      ...updates.channels,
    };
  }

  if (updates.triggers) {
    preferences.triggers = {
      ...preferences.triggers,
      ...updates.triggers,
    };
  }

  await preferences.save();
  await invalidateNotificationCaches(userId);

  return preferences;
};

/**
 * Get notifications for a user with filters
 */
export const getNotifications = async (filters: {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}): Promise<{ notifications: INotification[]; total: number; page: number; pages: number; unreadCount: number }> => {
  const { userId, isRead, type, page = 1, limit = 20 } = filters;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  // Build query
  const query: any = { userId, isVisibleInApp: true };
  if (isRead !== undefined) {
    query.isRead = isRead;
  }
  if (type) {
    query.type = type;
  }

  // Try cache for basic user queries (no filters)
  if (isRead === undefined && !type) {
    const cacheKey = `notifications:user:${userId}:${page}:${limit}`;
    const cached = await getCache<{ notifications: INotification[]; total: number; page: number; pages: number; unreadCount: number }>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Execute query
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  const result = {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
    unreadCount,
  };

  // Cache basic user queries
  if (isRead === undefined && !type) {
    const cacheKey = `notifications:user:${userId}:${page}:${limit}`;
    await setCache(cacheKey, result, CACHE_TTL);
  }

  return result;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<INotification> => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error('Invalid notification ID');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.isRead) {
    return notification; // Already read
  }

  notification.isRead = true;
  await notification.save();

  // Invalidate user's notification cache
  await invalidateNotificationCaches(userId);

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<{ modifiedCount: number }> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Invalidate user's notification cache
  await invalidateNotificationCaches(userId);

  return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error('Invalid notification ID');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const result = await Notification.deleteOne({
    _id: notificationId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new Error('Notification not found');
  }

  // Invalidate user's notification cache
  await invalidateNotificationCaches(userId);
};

/**
 * Delete old read notifications (cleanup job)
 * Deletes notifications that are read and older than specified days
 */
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<{ deletedCount: number }> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate },
  });

  console.log(`Cleaned up ${result.deletedCount} old notifications`);

  return { deletedCount: result.deletedCount };
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const count = await Notification.countDocuments({
    userId,
    isRead: false,
    isVisibleInApp: true,
  });

  return count;
};
