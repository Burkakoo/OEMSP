# Course Model Documentation

## Overview

The Course model represents educational courses in the MERN Education Platform. It implements a hierarchical structure with courses containing modules, which in turn contain lessons with attachments and resources.

## Schema Structure

### Main Course Document

```typescript
interface ICourse {
  title: string;                    // 5-200 characters, unique per instructor
  description: string;              // 50-5000 characters
  instructorId: ObjectId;           // Reference to User (instructor)
  category: string;                 // Course category
  level: CourseLevel;               // beginner | intermediate | advanced
  price: number;                    // 0-99999.99
  thumbnail?: string;               // HTTPS URL to image
  modules: IModule[];               // Array of module subdocuments
  prerequisites: string[];          // Array of prerequisite descriptions
  learningObjectives: string[];     // Array of learning objectives
  isPublished: boolean;             // Default: false
  enrollmentCount: number;          // Default: 0
  rating: number;                   // 0-5, Default: 0
  reviewCount: number;              // Default: 0
  createdAt: Date;                  // Auto-generated
  updatedAt: Date;                  // Auto-generated
}
```

### Module Subdocument

```typescript
interface IModule {
  _id: ObjectId;                    // Auto-generated
  title: string;                    // 2-200 characters
  description: string;              // 10-2000 characters
  order: number;                    // Non-negative integer
  lessons: ILesson[];               // Array of lesson subdocuments
}
```

### Lesson Subdocument

```typescript
interface ILesson {
  _id: ObjectId;                    // Auto-generated
  title: string;                    // 2-200 characters
  description: string;              // 10-2000 characters
  type: LessonType;                 // video | text | quiz | assignment
  content: string;                  // Lesson content
  videoUrl?: string;                // HTTPS URL (for video lessons)
  duration: number;                 // Duration in seconds (non-negative)
  order: number;                    // Non-negative integer
  resources: IResource[];           // Array of resource subdocuments
  attachments: IAttachment[];       // Array of attachment subdocuments
}
```

### Attachment Subdocument

```typescript
interface IAttachment {
  _id: ObjectId;                    // Auto-generated
  fileName: string;                 // Original file name
  fileType: string;                 // pdf | ppt | pptx | doc | docx | xls | xlsx | txt
  fileSize: number;                 // Size in bytes (1 - 52428800 = 50MB)
  fileUrl: string;                  // HTTPS URL to cloud storage
  uploadedAt: Date;                 // Auto-generated
  isDownloadable: boolean;          // Default: true
}
```

### Resource Subdocument

```typescript
interface IResource {
  title: string;                    // 2-200 characters
  url: string;                      // HTTPS URL
  type: string;                     // Resource type (e.g., 'documentation', 'tool')
}
```

## Enums

### CourseLevel
```typescript
enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}
```

### LessonType
```typescript
enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}
```

## Constants

### Allowed File Types
```typescript
const ALLOWED_FILE_TYPES = [
  'pdf',   // PDF documents
  'ppt',   // PowerPoint presentations
  'pptx',  // PowerPoint presentations (newer format)
  'doc',   // Word documents
  'docx',  // Word documents (newer format)
  'xls',   // Excel spreadsheets
  'xlsx',  // Excel spreadsheets (newer format)
  'txt',   // Text files
];
```

### Maximum File Size
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
```

## Validation Rules

### Course Level Validation

1. **Title**
   - Required
   - Length: 5-200 characters
   - Must be unique per instructor (compound unique index)

2. **Description**
   - Required
   - Length: 50-5000 characters

3. **Price**
   - Required
   - Range: 0-99999.99
   - Non-negative

4. **Level**
   - Required
   - Must be one of: beginner, intermediate, advanced

5. **Thumbnail**
   - Optional
   - Must be valid HTTPS URL ending in .jpg, .jpeg, .png, .gif, or .webp

### Module Validation

1. **Title**
   - Required
   - Length: 2-200 characters

2. **Description**
   - Required
   - Length: 10-2000 characters

3. **Order**
   - Required
   - Non-negative integer

### Lesson Validation

1. **Title**
   - Required
   - Length: 2-200 characters

2. **Description**
   - Required
   - Length: 10-2000 characters

3. **Type**
   - Required
   - Must be one of: video, text, quiz, assignment

4. **Duration**
   - Required
   - Non-negative integer (seconds)

5. **VideoUrl**
   - Optional
   - Must be valid HTTPS URL

### Attachment Validation

1. **File Type**
   - Required
   - Must be one of: pdf, ppt, pptx, doc, docx, xls, xlsx, txt
   - Automatically converted to lowercase

2. **File Size**
   - Required
   - Range: 1 byte - 52,428,800 bytes (50MB)

3. **File URL**
   - Required
   - Must be valid HTTPS URL

### Resource Validation

1. **Title**
   - Required
   - Length: 2-200 characters

2. **URL**
   - Required
   - Must be valid HTTPS URL

## Indexes

The Course model has the following indexes for optimal query performance:

1. **instructorId** (non-unique)
   - For querying courses by instructor

2. **category** (non-unique)
   - For filtering courses by category

3. **isPublished** (non-unique)
   - For filtering published/unpublished courses

4. **rating** (descending)
   - For sorting courses by rating

5. **Compound Index: (category, level, isPublished)**
   - For efficient filtering by multiple criteria

6. **Compound Unique Index: (instructorId, title)**
   - Ensures title uniqueness per instructor
   - Allows different instructors to have courses with the same title

## Usage Examples

### Creating a Course

```typescript
import Course, { CourseLevel, LessonType } from './models/Course';

const course = await Course.create({
  title: 'Introduction to TypeScript',
  description: 'Learn TypeScript from scratch with hands-on examples and real-world projects.',
  instructorId: instructorObjectId,
  category: 'Programming',
  level: CourseLevel.BEGINNER,
  price: 49.99,
  thumbnail: 'https://example.com/thumbnail.jpg',
  prerequisites: ['Basic JavaScript knowledge', 'Understanding of programming concepts'],
  learningObjectives: [
    'Understand TypeScript fundamentals',
    'Write type-safe code',
    'Use advanced TypeScript features',
  ],
});
```

### Adding Modules and Lessons

```typescript
course.modules.push({
  title: 'Getting Started',
  description: 'Introduction to TypeScript basics and setup',
  order: 0,
  lessons: [
    {
      title: 'What is TypeScript?',
      description: 'Learn about TypeScript and its benefits',
      type: LessonType.VIDEO,
      content: 'TypeScript is a typed superset of JavaScript...',
      videoUrl: 'https://example.com/video1.mp4',
      duration: 600,
      order: 0,
      resources: [
        {
          title: 'TypeScript Official Documentation',
          url: 'https://www.typescriptlang.org/docs/',
          type: 'documentation',
        },
      ],
      attachments: [
        {
          fileName: 'typescript-guide.pdf',
          fileType: 'pdf',
          fileSize: 1024000,
          fileUrl: 'https://example.com/files/typescript-guide.pdf',
          isDownloadable: true,
        },
      ],
    },
  ],
});

await course.save();
```

### Querying Courses

```typescript
// Find all published beginner courses in Programming category
const courses = await Course.find({
  category: 'Programming',
  level: CourseLevel.BEGINNER,
  isPublished: true,
}).sort({ rating: -1 });

// Find courses by instructor
const instructorCourses = await Course.find({
  instructorId: instructorObjectId,
});

// Find course with populated instructor data
const courseWithInstructor = await Course.findById(courseId)
  .populate('instructorId', 'firstName lastName email');
```

### Publishing a Course

```typescript
const course = await Course.findById(courseId);
course.isPublished = true;
await course.save();
```

## File Attachment Guidelines

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT
- **Presentations**: PPT, PPTX
- **Spreadsheets**: XLS, XLSX

### File Size Limits

- Maximum file size: 50MB per file
- Minimum file size: 1 byte

### Best Practices

1. Store files in cloud storage (AWS S3, Cloudflare R2, etc.)
2. Use HTTPS URLs for all file references
3. Validate file types on upload
4. Scan files for malware before storing
5. Implement access control (only enrolled students can download)
6. Track download activity for analytics

## Security Considerations

1. **Input Validation**
   - All fields are validated using Mongoose validators
   - File types are restricted to safe formats
   - File sizes are limited to prevent abuse

2. **Access Control**
   - Only instructors can create/modify their own courses
   - Only enrolled students can access course content
   - Admins have full access to all courses

3. **Data Integrity**
   - Unique title per instructor prevents duplicates
   - Referential integrity maintained through ObjectId references
   - Timestamps track creation and modification

## Testing

The Course model includes comprehensive tests covering:

- Schema validation for all fields
- Module, lesson, attachment, and resource subdocuments
- File type and size validation
- Index verification
- Unique constraints
- Default values
- Timestamps
- JSON serialization

Run tests with:
```bash
npm test -- Course.test.ts
```

## Related Models

- **User**: Referenced by `instructorId`
- **Enrollment**: References Course for student enrollments
- **Quiz**: References Course for assessments
- **Payment**: References Course for transactions
- **Certificate**: References Course for completion certificates

## Migration Notes

When migrating existing data:

1. Ensure all instructorId values reference valid User documents
2. Validate all file URLs are accessible
3. Check file sizes are within limits
4. Verify course titles are unique per instructor
5. Set default values for new fields (isPublished, enrollmentCount, rating, reviewCount)
