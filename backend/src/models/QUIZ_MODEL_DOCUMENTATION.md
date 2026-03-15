# Quiz Model Documentation

## Overview

The Quiz model represents quizzes and assessments within courses in the MERN Education Platform. It supports multiple question types including multiple choice, true/false, multi-select, and short answer questions. The model enforces comprehensive validation rules to ensure quiz integrity and proper assessment functionality.

## Schema Structure

### Main Quiz Document

```typescript
interface IQuiz {
  _id: ObjectId;
  courseId: ObjectId;           // Reference to Course
  moduleId: ObjectId;           // Reference to Module within Course
  title: string;                // Quiz title (5-200 characters)
  description: string;          // Quiz description (10-2000 characters)
  questions: IQuestion[];       // Array of questions (minimum 1)
  duration: number;             // Time limit in minutes (1-300)
  passingScore: number;         // Passing score percentage (0-100)
  maxAttempts: number;          // Maximum attempts allowed (1-10)
  isPublished: boolean;         // Publication status (default: false)
  createdAt: Date;              // Auto-generated timestamp
  updatedAt: Date;              // Auto-generated timestamp
}
```

### Question Subdocument

```typescript
interface IQuestion {
  _id: ObjectId;
  type: QuestionType;           // Question type enum
  text: string;                 // Question text (5-1000 characters)
  options: string[];            // Answer options (varies by type)
  correctAnswer: string | string[]; // Correct answer(s)
  points: number;               // Points awarded (0.1-1000)
  explanation?: string;         // Optional explanation (max 2000 characters)
}
```

### Question Types

```typescript
enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',  // Single correct answer from 2-6 options
  TRUE_FALSE = 'true_false',            // Binary true/false question
  MULTI_SELECT = 'multi_select',        // Multiple correct answers from 2-6 options
  SHORT_ANSWER = 'short_answer'         // Free-text answer
}
```

## Validation Rules

### Quiz-Level Validation

| Field | Rules |
|-------|-------|
| courseId | Required, must reference valid Course |
| moduleId | Required, must be valid ObjectId |
| title | Required, 5-200 characters, trimmed |
| description | Required, 10-2000 characters, trimmed |
| questions | Required, minimum 1 question |
| duration | Required, 1-300 minutes (integer) |
| passingScore | Required, 0-100 range (integer) |
| maxAttempts | Required, 1-10 attempts (integer) |
| isPublished | Boolean, defaults to false |

### Question-Level Validation

| Field | Rules |
|-------|-------|
| type | Required, must be valid QuestionType enum value |
| text | Required, 5-1000 characters, trimmed |
| options | Varies by question type (see below) |
| correctAnswer | Required, format varies by question type |
| points | Required, 0.1-1000, supports decimals |
| explanation | Optional, max 2000 characters |

### Question Type-Specific Rules

#### Multiple Choice
- **options**: Must have 2-6 options
- **correctAnswer**: Must be a string (single answer)

#### True/False
- **options**: Empty array or exactly 2 options
- **correctAnswer**: Must be a string

#### Multi-Select
- **options**: Must have 2-6 options
- **correctAnswer**: Must be an array with at least 1 answer

#### Short Answer
- **options**: Must be empty array
- **correctAnswer**: Must be a string

## Indexes

The model includes the following indexes for query optimization:

- **courseId**: Non-unique index for finding quizzes by course
- **moduleId**: Non-unique index for finding quizzes by module

## Usage Examples

### Creating a Quiz with Multiple Question Types

```typescript
import Quiz, { QuestionType } from './models/Quiz';

const quiz = await Quiz.create({
  courseId: courseObjectId,
  moduleId: moduleObjectId,
  title: 'TypeScript Fundamentals Quiz',
  description: 'Test your understanding of TypeScript basics',
  questions: [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      text: 'What is TypeScript?',
      options: [
        'A programming language',
        'A database',
        'An operating system'
      ],
      correctAnswer: 'A programming language',
      points: 10,
      explanation: 'TypeScript is a typed superset of JavaScript'
    },
    {
      type: QuestionType.TRUE_FALSE,
      text: 'TypeScript compiles to JavaScript',
      options: [],
      correctAnswer: 'true',
      points: 5
    },
    {
      type: QuestionType.MULTI_SELECT,
      text: 'Which are valid TypeScript types?',
      options: ['string', 'number', 'boolean', 'color'],
      correctAnswer: ['string', 'number', 'boolean'],
      points: 15
    },
    {
      type: QuestionType.SHORT_ANSWER,
      text: 'What does TSC stand for?',
      options: [],
      correctAnswer: 'TypeScript Compiler',
      points: 20
    }
  ],
  duration: 30,
  passingScore: 70,
  maxAttempts: 3
});
```

### Finding Quizzes by Course

```typescript
const courseQuizzes = await Quiz.find({ courseId: courseObjectId });
```

### Finding Quizzes by Module

```typescript
const moduleQuizzes = await Quiz.find({ moduleId: moduleObjectId });
```

### Populating Course Reference

```typescript
const quiz = await Quiz.findById(quizId).populate('courseId');
console.log(quiz.courseId.title); // Access course title
```

### Updating Quiz

```typescript
const quiz = await Quiz.findById(quizId);
quiz.title = 'Updated Quiz Title';
quiz.passingScore = 75;
await quiz.save();
```

### Publishing a Quiz

```typescript
const quiz = await Quiz.findById(quizId);
quiz.isPublished = true;
await quiz.save();
```

## Integration with Other Models

### Course Relationship
- Each quiz belongs to one course (referenced by `courseId`)
- Courses can have multiple quizzes
- Use population to access course details

### Module Relationship
- Each quiz is associated with a specific module within a course
- The `moduleId` references a subdocument within the Course model
- This allows organizing quizzes by course sections

### Enrollment Integration
- Students take quizzes as part of their course enrollment
- Quiz results are tracked separately in QuizResult model
- Quiz completion contributes to overall course progress

## Best Practices

### Quiz Design
1. **Question Count**: Include at least 5-10 questions for meaningful assessment
2. **Point Distribution**: Assign points based on question difficulty
3. **Time Allocation**: Allow 1-2 minutes per question on average
4. **Passing Score**: Set realistic passing scores (typically 60-80%)
5. **Attempt Limits**: Balance learning opportunities with assessment integrity

### Question Writing
1. **Clear Text**: Write unambiguous question text
2. **Balanced Options**: Ensure all options are plausible for multiple choice
3. **Explanations**: Provide explanations for learning reinforcement
4. **Point Values**: Use consistent point values or weight by difficulty

### Validation
1. **Pre-Publishing**: Validate all questions before publishing
2. **Test Taking**: Test the quiz yourself before releasing to students
3. **Review Feedback**: Monitor student performance and adjust as needed

### Performance
1. **Indexing**: Leverage courseId and moduleId indexes for queries
2. **Pagination**: Paginate quiz lists for courses with many quizzes
3. **Selective Loading**: Only load questions when needed for quiz taking

## Error Handling

Common validation errors and their causes:

| Error | Cause | Solution |
|-------|-------|----------|
| "Quiz must have at least 1 question" | Empty questions array | Add at least one question |
| "Invalid number of options for question type" | Wrong option count | Ensure 2-6 options for MC/MS |
| "Invalid correct answer format" | Wrong answer type | Use string for MC/TF/SA, array for MS |
| "Duration cannot exceed 300 minutes" | Duration too long | Set duration ≤ 300 minutes |
| "Passing score cannot exceed 100" | Invalid percentage | Set passing score 0-100 |
| "Maximum attempts cannot exceed 10" | Too many attempts | Set maxAttempts 1-10 |

## Testing

The model includes comprehensive unit tests covering:
- Schema validation for all fields
- Question type-specific validation
- Boundary value testing
- Multiple question scenarios
- Index verification
- Timestamp functionality
- JSON serialization
- Population capabilities

Run tests with:
```bash
npm test -- Quiz.test.ts
```

## Related Models

- **Course**: Parent model containing modules
- **User**: Instructors create quizzes, students take them
- **Enrollment**: Links students to courses with quizzes
- **QuizResult**: Stores student quiz attempt results (to be implemented)

## Future Enhancements

Potential improvements for future iterations:
1. Question bank and randomization
2. Question difficulty levels
3. Adaptive testing
4. Question categories/tags
5. Image/media support in questions
6. Timed individual questions
7. Question feedback/hints
8. Partial credit for multi-select
9. Question ordering options
10. Quiz templates
