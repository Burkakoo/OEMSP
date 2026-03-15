# Notification Model Documentation

## Overview

The Notification model manages in-app notifications for users in the MERN Education Platform. It supports multiple notification types including enrollment confirmations, course updates, quiz grading, certificate issuance, payment status, and system announcements. The model tracks read/unread status and provides efficient querying through compound indexes.

## Schema Definition

### Main Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `userId` | ObjectId | Yes | Reference to User who receives the notification | Must reference valid User document |
| `type` | String (Enum) | Yes | Type of notification | Must be one of: enrollment, course_update, quiz_graded, certificate_issued, payment_success, payment_failed, system |
| `title` | String | Yes | Notification title | 5-100 characters, trimmed |
| `message` | String | Yes | Notification message content | 10-500 characters, trimmed |
| `data` | Mixed | No | Optional additional context data | Can store any JSON-serializable data |
| `isRead` | Boolean | Yes | Read status of notification | Defaults to false |
| `readAt` | Date | No | Timestamp when notification was read | Automatically set when isRead becomes true |
| `createdAt` | Date | Auto | Timestamp of notification creation | Automatically managed by Mongoose |
| `updatedAt` | Date | Auto | Timestamp of last update | Automatically managed by Mongoose |

### Notification Types

```typescript
enum NotificationType {
  ENROLLMENT = 'enrollment',           // Course enrollment success
  COURSE_UPDATE = 'course_update',     // Course content updates
  QUIZ_GRADED = 'quiz_graded',         // Quiz grading completion
  CERTIFICATE_ISSUED = 'certificate_issued', // Certificate generation
  PAYMENT_SUCCESS = 'payment_success', // Successful payment
  PAYMENT_FAILED = 'payment_failed',   // Failed payment
  SYSTEM = 'system'                    // System announcements
}
```

## Indexes

The Notification model implements the following indexes for optimal query performance:

1. **userId** (non-unique): For querying all notifications for a specific user
2. **isRead** (non-unique): For filtering read/unread notifications
3. **createdAt** (descending): For sorting notifications by date (newest first)
4. **Compound Index (userId, isRead, createdAt)**: For efficient queries like "Get all unread notifications for user X, sorted by date"

## Pre-Save Hooks

### Read Status Management

The model automatically manages the `readAt` timestamp:

- When `isRead` is set to `true` and `readAt` is not set, `readAt` is automatically set to the current timestamp
- When `isRead` is set to `false`, `readAt` is cleared (set to undefined)

```typescript
NotificationSchema.pre<INotification>('save', function () {
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  if (!this.isRead && this.readAt) {
    this.readAt = undefined;
  }
});
```

## Usage Examples

### Creating Notifications

#### Enrollment Notification
```typescript
const notification = await Notification.create({
  userId: studentId,
  type: NotificationType.ENROLLMENT,
  title: 'Course Enrollment Successful',
  message: 'You have successfully enrolled in Introduction to TypeScript',
  data: {
    courseId: courseId,
    courseName: 'Introduction to TypeScript',
    enrollmentDate: new Date()
  }
});
```

#### Quiz Graded Notification
```typescript
const notification = await Notification.create({
  userId: studentId,
  type: NotificationType.QUIZ_GRADED,
  title: 'Quiz Graded',
  message: 'Your quiz "JavaScript Fundamentals" has been graded. Score: 85%',
  data: {
    quizId: quizId,
    quizTitle: 'JavaScript Fundamentals',
    score: 85,
    percentage: 85,
    passed: true
  }
});
```

#### Certificate Issued Notification
```typescript
const notification = await Notification.create({
  userId: studentId,
  type: NotificationType.CERTIFICATE_ISSUED,
  title: 'Certificate Issued',
  message: 'Your course completion certificate is ready for download',
  data: {
    certificateId: certificateId,
    courseTitle: 'Advanced React Development',
    completionDate: new Date()
  }
});
```

#### Payment Success Notification
```typescript
const notification = await Notification.create({
  userId: userId,
  type: NotificationType.PAYMENT_SUCCESS,
  title: 'Payment Successful',
  message: 'Your payment of $49.99 has been processed successfully',
  data: {
    paymentId: paymentId,
    amount: 49.99,
    currency: 'USD',
    courseTitle: 'Web Development Bootcamp'
  }
});
```

#### System Announcement
```typescript
const notification = await Notification.create({
  userId: userId,
  type: NotificationType.SYSTEM,
  title: 'Platform Maintenance',
  message: 'Scheduled maintenance will occur tomorrow from 2 AM to 4 AM EST',
  data: {
    maintenanceStart: new Date('2024-01-15T02:00:00Z'),
    maintenanceEnd: new Date('2024-01-15T04:00:00Z')
  }
});
```

### Querying Notifications

#### Get All Notifications for a User (Newest First)
```typescript
const notifications = await Notification.find({ userId: userId })
  .sort({ createdAt: -1 })
  .limit(20);
```

#### Get Unread Notifications
```typescript
const unreadNotifications = await Notification.find({
  userId: userId,
  isRead: false
}).sort({ createdAt: -1 });
```

#### Get Unread Notification Count
```typescript
const unreadCount = await Notification.countDocuments({
  userId: userId,
  isRead: false
});
```

#### Get Notifications by Type
```typescript
const paymentNotifications = await Notification.find({
  userId: userId,
  type: { $in: [NotificationType.PAYMENT_SUCCESS, NotificationType.PAYMENT_FAILED] }
}).sort({ createdAt: -1 });
```

#### Paginated Notifications
```typescript
const page = 1;
const limit = 20;
const skip = (page - 1) * limit;

const notifications = await Notification.find({ userId: userId })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

const total = await Notification.countDocuments({ userId: userId });
```

### Marking Notifications as Read

#### Mark Single Notification as Read
```typescript
const notification = await Notification.findById(notificationId);
if (notification) {
  notification.isRead = true;
  await notification.save(); // readAt is automatically set
}
```

#### Mark All Notifications as Read
```typescript
await Notification.updateMany(
  { userId: userId, isRead: false },
  { 
    isRead: true,
    readAt: new Date()
  }
);
```

### Deleting Notifications

#### Delete Single Notification
```typescript
await Notification.findByIdAndDelete(notificationId);
```

#### Delete Old Notifications (90+ days)
```typescript
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

await Notification.deleteMany({
  createdAt: { $lt: ninetyDaysAgo }
});
```

#### Delete All Read Notifications for User
```typescript
await Notification.deleteMany({
  userId: userId,
  isRead: true
});
```

## Validation Rules

### Title Validation
- **Required**: Yes
- **Minimum Length**: 5 characters
- **Maximum Length**: 100 characters
- **Trimmed**: Yes
- **Example Valid**: "Course Enrollment Successful"
- **Example Invalid**: "Test" (too short), "A".repeat(101) (too long)

### Message Validation
- **Required**: Yes
- **Minimum Length**: 10 characters
- **Maximum Length**: 500 characters
- **Trimmed**: Yes
- **Example Valid**: "You have successfully enrolled in Introduction to TypeScript"
- **Example Invalid**: "Short" (too short), "A".repeat(501) (too long)

### Type Validation
- **Required**: Yes
- **Allowed Values**: enrollment, course_update, quiz_graded, certificate_issued, payment_success, payment_failed, system
- **Example Valid**: NotificationType.ENROLLMENT
- **Example Invalid**: "invalid_type"

## Best Practices

### 1. Use Appropriate Notification Types
Always use the correct notification type enum value to ensure consistency:
```typescript
// Good
type: NotificationType.ENROLLMENT

// Bad
type: 'enrollment' // Use enum instead
```

### 2. Include Relevant Data
Store additional context in the `data` field for richer notifications:
```typescript
data: {
  courseId: courseId,
  courseName: 'Introduction to TypeScript',
  enrollmentDate: new Date(),
  instructorName: 'John Doe'
}
```

### 3. Efficient Querying
Use the compound index for optimal performance:
```typescript
// Efficient - uses compound index
const unreadNotifications = await Notification.find({
  userId: userId,
  isRead: false
}).sort({ createdAt: -1 });
```

### 4. Pagination
Always paginate notification lists to avoid performance issues:
```typescript
const limit = 20;
const skip = (page - 1) * limit;

const notifications = await Notification.find({ userId: userId })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
```

### 5. Cleanup Old Notifications
Implement a scheduled job to delete notifications older than 90 days:
```typescript
// Run daily
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

await Notification.deleteMany({
  createdAt: { $lt: ninetyDaysAgo }
});
```

### 6. Batch Operations
Use bulk operations for marking multiple notifications as read:
```typescript
// Efficient
await Notification.updateMany(
  { userId: userId, isRead: false },
  { isRead: true, readAt: new Date() }
);

// Inefficient - avoid
const notifications = await Notification.find({ userId: userId, isRead: false });
for (const notification of notifications) {
  notification.isRead = true;
  await notification.save();
}
```

## Integration with Other Models

### User Model
Notifications reference the User model through `userId`:
```typescript
const notification = await Notification.findById(notificationId)
  .populate('userId', 'firstName lastName email');
```

### Course Model
Store course information in the `data` field:
```typescript
data: {
  courseId: courseId,
  courseTitle: 'Introduction to TypeScript',
  instructorName: 'John Doe'
}
```

### Quiz Model
Store quiz information in the `data` field:
```typescript
data: {
  quizId: quizId,
  quizTitle: 'JavaScript Fundamentals',
  score: 85,
  percentage: 85,
  passed: true
}
```

### Payment Model
Store payment information in the `data` field:
```typescript
data: {
  paymentId: paymentId,
  amount: 49.99,
  currency: 'USD',
  transactionId: 'txn_123456'
}
```

### Certificate Model
Store certificate information in the `data` field:
```typescript
data: {
  certificateId: certificateId,
  verificationCode: 'ABC123XYZ456',
  certificateUrl: 'https://cdn.example.com/certificates/cert_123.pdf'
}
```

## Error Handling

### Common Validation Errors
```typescript
try {
  const notification = await Notification.create({
    userId: userId,
    type: NotificationType.SYSTEM,
    title: 'Test',
    message: 'Short'
  });
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
    console.error('Validation failed:', error.message);
    // "Title must be at least 5 characters"
    // "Message must be at least 10 characters"
  }
}
```

### Missing Required Fields
```typescript
try {
  const notification = await Notification.create({
    userId: userId,
    title: 'Test Notification'
    // Missing type and message
  });
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('Required fields missing:', error.message);
  }
}
```

## Performance Considerations

### Index Usage
The compound index `(userId, isRead, createdAt)` is optimized for the most common query pattern:
```typescript
// This query uses the compound index efficiently
const unreadNotifications = await Notification.find({
  userId: userId,
  isRead: false
}).sort({ createdAt: -1 });
```

### Pagination
Always use pagination for notification lists:
```typescript
// Good - paginated
const notifications = await Notification.find({ userId: userId })
  .sort({ createdAt: -1 })
  .limit(20)
  .skip(skip);

// Bad - loads all notifications
const notifications = await Notification.find({ userId: userId });
```

### Bulk Operations
Use bulk operations for better performance:
```typescript
// Good - single database operation
await Notification.updateMany(
  { userId: userId, isRead: false },
  { isRead: true, readAt: new Date() }
);

// Bad - multiple database operations
const notifications = await Notification.find({ userId: userId, isRead: false });
for (const notification of notifications) {
  notification.isRead = true;
  await notification.save();
}
```

## Testing

The Notification model includes comprehensive unit tests covering:
- Schema validation for all fields
- All notification types
- Optional data field
- Read status management
- Index verification
- Querying notifications
- Timestamps
- JSON transformation

Run tests with:
```bash
npm test -- Notification.test.ts
```

## Related Documentation

- [User Model Documentation](./USER_MODEL_DOCUMENTATION.md)
- [Course Model Documentation](./COURSE_MODEL_DOCUMENTATION.md)
- [Payment Model Documentation](./PAYMENT_MODEL_DOCUMENTATION.md)
- [Certificate Model Documentation](./CERTIFICATE_MODEL_DOCUMENTATION.md)
- [Requirements Document](../../.kiro/specs/mern-education-platform/requirements.md)
- [Design Document](../../.kiro/specs/mern-education-platform/design.md)
