import mongoose from 'mongoose';
import Notification, { INotification, NotificationType } from '../models/Notification';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';

const CACHE_TTL = 300; // 5 minutes

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
  });

  // Invalidate user's notification cache
  await deleteCache(`notifications:user:${data.userId}`);

  return notification;
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
  const query: any = { userId };
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
  await deleteCache(`notifications:user:${userId}`);

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
  await deleteCache(`notifications:user:${userId}`);

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
  await deleteCache(`notifications:user:${userId}`);
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
  });

  return count;
};
