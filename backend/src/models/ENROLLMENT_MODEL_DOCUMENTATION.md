# Enrollment Model Documentation

## Overview

The Enrollment model represents a student's enrollment in a course. It tracks enrollment details, lesson progress, completion status, and certificate information. The model enforces a unique constraint to prevent duplicate enrollments for the same student-course pair.

## Schema Structure

### Main Fields

- **studentId** (ObjectId, required): Reference to the User model (student role)
- **courseId** (ObjectId, required): Reference to the Course model
- **paymentId** (ObjectId, required): Reference to the Payment model
- **enrolledAt** (Date, required): Timestamp when enrollment was created (auto-set)
- **progress** (Array of LessonProgress): Array tracking completion status for each lesson
- **completionPercentage** (Number, default: 0): Course completion percentage (0-100)
- **isCompleted** (Boolean, default: false): Whether the course is fully completed
- **completedAt** (Date, optional): Timestamp when course was completed
- **certificateId** (ObjectId, optional): Reference to the Certificate model
- **lastAccessedAt** (Date, required): Last time student accessed the course (auto-set)

### LessonProgress Subdocument

- **lessonId** (ObjectId, required): Reference to a lesson within the course
- **completed** (Boolean, default: false): Whether the lesson is completed
- **completedAt** (Date, optional): Timestamp when lesson was completed
- **timeSpent** (Number, default: 0): Time spent on lesson in seconds (min: 0)

## Validation Rules

### Required Fields
- studentId, courseId, paymentId must be provided
- enrolledAt and lastAccessedAt are auto-set if not provided

### Completion Percentage
- Must be between 0 and 100 (inclusive)
- Defaults to 0 for new enrollments

### Lesson Progress
- lessonId is required for each progress entry
- timeSpent cannot be negative
- completed defaults to false

### Unique Constraint
- Compound unique index on (studentId, courseId) prevents duplicate enrollments
- Same student can enroll in different courses
- Different students can enroll in the same course

## Indexes

1. **Compound Unique Index**: `{ studentId: 1, courseId: 1 }` (unique)
   - Prevents duplicate enrollments
   - Optimizes queries for student-course pairs

2. **studentId Index**: `{ studentId: 1 }` (non-unique)
   - Optimizes queries for all enrollments by a student

3. **courseId Index**: `{ courseId: 1 }` (non-unique)
   - Optimizes queries for all enrollments in a course

4. **isCompleted Index**: `{ isCompleted: 1 }` (non-unique)
   - Optimizes queries for completed/in-progress enrollments

## Usage Examples

### Creating an Enrollment

```typescript
import Enrollment from './models/Enrollment';

const enrollment = await Enrollment.create({
  studentId: studentObjectId,
  courseId: courseObjectId,
  paymentId: paymentObjectId,
});

// Enrollment is created with:
// - completionPercentage: 0
// - isCompleted: false
// - progress: []
// - enrolledAt: current timestamp
// - lastAccessedAt: current timestamp
```

### Tracking Lesson Progress

```typescript
// Add lesson progress
enrollment.progress.push({
  lessonId: lessonObjectId,
  completed: true,
  completedAt: new Date(),
  timeSpent: 3600, // 1 hour in seconds
});

await enrollment.save();
```

### Updating Completion Status

```typescript
// Update completion percentage
enrollment.completionPercentage = 75;
enrollment.lastAccessedAt = new Date();
await enrollment.save();

// Mark as completed
enrollment.completionPercentage = 100;
enrollment.isCompleted = true;
enrollment.completedAt = new Date();
await enrollment.save();
```

### Querying Enrollments

```typescript
// Find all enrollments for a student
const studentEnrollments = await Enrollment.find({
  studentId: studentObjectId,
});

// Find all enrollments for a course
const courseEnrollments = await Enrollment.find({
  courseId: courseObjectId,
});

// Find completed enrollments
const completedEnrollments = await Enrollment.find({
  isCompleted: true,
});

// Find in-progress enrollments
const inProgressEnrollments = await Enrollment.find({
  isCompleted: false,
  completionPercentage: { $gt: 0 },
});
```

### Population

```typescript
// Populate student and course details
const enrollment = await Enrollment.findById(enrollmentId)
  .populate('studentId')
  .populate('courseId')
  .populate('certificateId');

// Access populated data
console.log(enrollment.studentId.email);
console.log(enrollment.courseId.title);
```

## Business Logic Considerations

### Enrollment Creation
1. Verify payment is completed before creating enrollment
2. Verify payment amount matches course price
3. Verify course is published
4. Initialize with empty progress array and 0% completion

### Progress Tracking
1. Calculate completion percentage as: (completed lessons / total lessons) * 100
2. Update lastAccessedAt whenever progress is updated
3. Ensure progress is monotonically increasing (lessons can't be "uncompleted")

### Course Completion
1. Set isCompleted to true when completionPercentage reaches 100%
2. Set completedAt timestamp
3. Trigger certificate generation
4. Prevent further progress updates after completion

### Duplicate Prevention
- The compound unique index ensures a student cannot enroll in the same course twice
- Attempting to create a duplicate enrollment will throw a MongoDB duplicate key error

## Integration Points

### With User Model
- studentId references User with role: 'student'
- Used to fetch student details and verify student role

### With Course Model
- courseId references Course
- Used to fetch course details, modules, and lessons
- Used to calculate total lessons for completion percentage

### With Payment Model
- paymentId references Payment
- Used to verify payment completion before enrollment
- Used to track revenue and refunds

### With Certificate Model
- certificateId references Certificate (optional)
- Set when certificate is generated upon course completion
- Used to fetch certificate details

## Testing

The model includes comprehensive unit tests covering:
- Schema validation for all fields
- Unique compound index enforcement
- Completion percentage validation (0-100 range)
- Lesson progress subdocument functionality
- Timestamp management (enrolledAt, lastAccessedAt, createdAt, updatedAt)
- Index verification
- JSON serialization
- Population of references
- Query operations

Run tests with:
```bash
npm test -- Enrollment.test.ts
```

## Performance Considerations

1. **Indexes**: All required indexes are defined for optimal query performance
2. **Progress Array**: Consider limiting progress array size for courses with many lessons
3. **Population**: Use selective population to avoid loading unnecessary data
4. **Queries**: Use indexed fields (studentId, courseId, isCompleted) in queries

## Security Considerations

1. **Access Control**: Verify user permissions before allowing enrollment operations
2. **Payment Verification**: Always verify payment completion before creating enrollment
3. **Data Integrity**: Use transactions for operations that modify multiple collections
4. **Input Validation**: Validate all input data before creating/updating enrollments
