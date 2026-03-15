import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Notification, { NotificationType } from '../Notification';
import User, { UserRole } from '../User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Notification.deleteMany({});
  await User.deleteMany({});
});

describe('Notification Model', () => {
  // Helper function to create a test user
  const createTestUser = async () => {
    const user = new User({
      email: 'student@example.com',
      passwordHash: 'hashedpassword123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
    });
    return await user.save();
  };

  describe('Schema Validation', () => {
    it('should create a valid notification with all required fields', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.ENROLLMENT,
        title: 'Course Enrollment Successful',
        message: 'You have successfully enrolled in Introduction to TypeScript',
      });

      const savedNotification = await notification.save();
      
      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.userId.toString()).toBe(user._id.toString());
      expect(savedNotification.type).toBe(NotificationType.ENROLLMENT);
      expect(savedNotification.title).toBe('Course Enrollment Successful');
      expect(savedNotification.message).toBe('You have successfully enrolled in Introduction to TypeScript');
      expect(savedNotification.isRead).toBe(false);
      expect(savedNotification.readAt).toBeUndefined();
      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.updatedAt).toBeDefined();
    });

    it('should fail validation when userId is missing', async () => {
      const notification = new Notification({
        type: NotificationType.ENROLLMENT,
        title: 'Test Notification',
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    it('should fail validation when type is missing', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        title: 'Test Notification',
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    it('should fail validation when title is missing', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    it('should fail validation when message is missing', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
      });

      await expect(notification.save()).rejects.toThrow();
    });

    it('should fail validation when title is too short', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test',
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow(/Title must be at least 5 characters/);
    });

    it('should fail validation when title is too long', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'A'.repeat(101),
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow(/Title cannot exceed 100 characters/);
    });

    it('should fail validation when message is too short', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'Short',
      });

      await expect(notification.save()).rejects.toThrow(/Message must be at least 10 characters/);
    });

    it('should fail validation when message is too long', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'A'.repeat(501),
      });

      await expect(notification.save()).rejects.toThrow(/Message cannot exceed 500 characters/);
    });

    it('should fail validation with invalid notification type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: 'invalid_type',
        title: 'Test Notification',
        message: 'This is a test notification message',
      });

      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Notification Types', () => {
    it('should create notification with ENROLLMENT type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.ENROLLMENT,
        title: 'Enrollment Success',
        message: 'You have been enrolled in the course',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.ENROLLMENT);
    });

    it('should create notification with COURSE_UPDATE type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.COURSE_UPDATE,
        title: 'Course Updated',
        message: 'New content has been added to your course',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.COURSE_UPDATE);
    });

    it('should create notification with QUIZ_GRADED type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.QUIZ_GRADED,
        title: 'Quiz Graded',
        message: 'Your quiz has been graded. Score: 85%',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.QUIZ_GRADED);
    });

    it('should create notification with CERTIFICATE_ISSUED type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.CERTIFICATE_ISSUED,
        title: 'Certificate Issued',
        message: 'Your course completion certificate is ready',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.CERTIFICATE_ISSUED);
    });

    it('should create notification with PAYMENT_SUCCESS type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.PAYMENT_SUCCESS);
    });

    it('should create notification with PAYMENT_FAILED type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment Failed',
        message: 'Your payment could not be processed',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.PAYMENT_FAILED);
    });

    it('should create notification with SYSTEM type', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'System Announcement',
        message: 'Platform maintenance scheduled for tomorrow',
      });

      const saved = await notification.save();
      expect(saved.type).toBe(NotificationType.SYSTEM);
    });
  });

  describe('Optional Data Field', () => {
    it('should store additional data in data field', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.QUIZ_GRADED,
        title: 'Quiz Graded',
        message: 'Your quiz has been graded',
        data: {
          quizId: new mongoose.Types.ObjectId(),
          score: 85,
          percentage: 85,
          passed: true,
        },
      });

      const saved = await notification.save();
      expect(saved.data).toBeDefined();
      expect(saved.data.score).toBe(85);
      expect(saved.data.percentage).toBe(85);
      expect(saved.data.passed).toBe(true);
    });

    it('should work without data field', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'System Message',
        message: 'This is a system message',
      });

      const saved = await notification.save();
      expect(saved.data).toBeUndefined();
    });
  });

  describe('Read Status Management', () => {
    it('should default isRead to false', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(false);
      expect(saved.readAt).toBeUndefined();
    });

    it('should set readAt timestamp when isRead is set to true', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
        isRead: true,
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(true);
      expect(saved.readAt).toBeDefined();
      expect(saved.readAt).toBeInstanceOf(Date);
    });

    it('should update readAt when marking notification as read', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(false);
      expect(saved.readAt).toBeUndefined();

      saved.isRead = true;
      const updated = await saved.save();
      
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should clear readAt when marking notification as unread', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
        isRead: true,
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(true);
      expect(saved.readAt).toBeDefined();

      saved.isRead = false;
      const updated = await saved.save();
      
      expect(updated.isRead).toBe(false);
      expect(updated.readAt).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on userId', async () => {
      const indexes = Notification.schema.indexes();
      const userIdIndex = indexes.find((index: any) => {
        const keys = index[0] as Record<string, number>;
        return keys.userId === 1;
      });
      
      expect(userIdIndex).toBeDefined();
    });

    it('should have index on isRead', async () => {
      const indexes = Notification.schema.indexes();
      const isReadIndex = indexes.find((index: any) => {
        const keys = index[0] as Record<string, number>;
        return keys.isRead === 1;
      });
      
      expect(isReadIndex).toBeDefined();
    });

    it('should have descending index on createdAt', async () => {
      const indexes = Notification.schema.indexes();
      const createdAtIndex = indexes.find((index: any) => {
        const keys = index[0] as Record<string, number>;
        return keys.createdAt === -1;
      });
      
      expect(createdAtIndex).toBeDefined();
    });

    it('should have compound index on userId, isRead, and createdAt', async () => {
      const indexes = Notification.schema.indexes();
      const compoundIndex = indexes.find((index: any) => {
        const keys = index[0] as Record<string, number>;
        return keys.userId === 1 && keys.isRead === 1 && keys.createdAt === -1;
      });
      
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Querying Notifications', () => {
    it('should query notifications by userId', async () => {
      const user1 = await createTestUser();
      const user2 = new User({
        email: 'user2@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
      });
      await user2.save();

      await Notification.create({
        userId: user1._id,
        type: NotificationType.SYSTEM,
        title: 'Notification 1',
        message: 'Message for user 1',
      });

      await Notification.create({
        userId: user2._id,
        type: NotificationType.SYSTEM,
        title: 'Notification 2',
        message: 'Message for user 2',
      });

      const user1Notifications = await Notification.find({ userId: user1._id });
      expect(user1Notifications).toHaveLength(1);
      expect(user1Notifications[0]?.title).toBe('Notification 1');
    });

    it('should query unread notifications', async () => {
      const user = await createTestUser();

      await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Unread Notification',
        message: 'This is unread',
        isRead: false,
      });

      await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Read Notification',
        message: 'This is read',
        isRead: true,
      });

      const unreadNotifications = await Notification.find({
        userId: user._id,
        isRead: false,
      });

      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0]?.title).toBe('Unread Notification');
    });

    it('should sort notifications by createdAt descending', async () => {
      const user = await createTestUser();

      const notification1 = await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'First Notification',
        message: 'This was created first',
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const notification2 = await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Second Notification',
        message: 'This was created second',
      });

      const notifications = await Notification.find({ userId: user._id }).sort({
        createdAt: -1,
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0]?._id.toString()).toBe(notification2._id.toString());
      expect(notifications[1]?._id.toString()).toBe(notification1._id.toString());
    });

    it('should efficiently query using compound index', async () => {
      const user = await createTestUser();

      // Create notifications with explicit delays to ensure ordering
      const notif1 = await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Unread 1',
        message: 'Unread message 1',
        isRead: false,
      });

      // Wait to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 50));

      const notif2 = await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Unread 2',
        message: 'Unread message 2',
        isRead: false,
      });

      // Wait to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 50));

      await Notification.create({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Read 1',
        message: 'Read message 1',
        isRead: true,
      });

      const unreadNotifications = await Notification.find({
        userId: user._id,
        isRead: false,
      }).sort({ createdAt: -1 });

      expect(unreadNotifications).toHaveLength(2);
      // Most recent unread should be first (notif2)
      expect(unreadNotifications[0]?._id.toString()).toBe(notif2._id.toString());
      expect(unreadNotifications[1]?._id.toString()).toBe(notif1._id.toString());
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      const originalUpdatedAt = saved.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      saved.isRead = true;
      const updated = await saved.save();

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude __v field in JSON output', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      const json = saved.toJSON();

      expect(json.__v).toBeUndefined();
      expect(json._id).toBeDefined();
      expect(json.userId).toBeDefined();
    });

    it('should exclude __v field in object output', async () => {
      const user = await createTestUser();
      
      const notification = new Notification({
        userId: user._id,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const saved = await notification.save();
      const obj = saved.toObject();

      expect(obj.__v).toBeUndefined();
      expect(obj._id).toBeDefined();
      expect(obj.userId).toBeDefined();
    });
  });
});
