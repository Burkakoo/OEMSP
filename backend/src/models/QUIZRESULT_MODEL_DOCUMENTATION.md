# QuizResult Model Documentation

## Overview
The QuizResult model stores graded quiz submissions from students, including their answers, scores, and pass/fail status. It supports multiple attempts per student per quiz and tracks detailed answer information for each question.

## Schema Structure

### Main Fields

#### studentId
- **Type**: ObjectId (Reference to User)
- **Required**: Yes
- **Validation**: Must reference a valid User with student role
- **Description**: The student who submitted the quiz

#### quizId
- **Type**: ObjectId (Reference to Quiz)
- **Required**: Yes
- **Description**: The quiz that was submitted

#### answers
- **Type**: Array of QuizAnswer subdocuments
- **Required**: Yes
- **Validation**: Must contain at least 1 answer
- **Description**: Array of student's answers to quiz questions

#### score
- **Type**: Number
- **Required**: Yes
- **Validation**: Must be non-negative (>= 0)
- **Description**: Total points earned by the student

#### percentage
- **Type**: Number
- **Required**: Yes
- **Validation**: Must be between 0 and 100 (inclusive)
- **Description**: Percentage score calculated as (score / maximum score) * 100

#### passed
- **Type**: Boolean
- **Required**: Yes
- **Description**: Whether the student passed based on the quiz's passing score threshold

#### attemptNumber
- **Type**: Number
- **Required**: Yes
- **Validation**: Must be at least 1
- **Description**: The attempt number for this submission (1 for first attempt, 2 for second, etc.)

#### submittedAt
- **Type**: Date
- **Required**: Yes
- **Default**: Current timestamp
- **Description**: When the student submitted the quiz

#### gradedAt
- **Type**: Date
- **Required**: Yes
- **Default**: Current timestamp
- **Description**: When the quiz was graded

#### createdAt
- **Type**: Date
- **Auto-generated**: Yes
- **Description**: Timestamp when the document was created

#### updatedAt
- **Type**: Date
- **Auto-generated**: Yes
- **Description**: Timestamp when the document was last updated

## QuizAnswer Subdocument

### Fields

#### questionId
- **Type**: ObjectId
- **Required**: Yes
- **Description**: Reference to the question being answered

#### studentAnswer
- **Type**: String or Array of Strings
- **Required**: Yes
- **Validation**: 
  - If string: Must be non-empty
  - If array: Must contain at least one non-empty string
- **Description**: The student's answer (string for single-answer questions, array for multi-select)

#### isCorrect
- **Type**: Boolean
- **Required**: Yes
- **Description**: Whether the student's answer was correct

#### pointsEarned
- **Type**: Number
- **Required**: Yes
- **Validation**: Must be non-negative (>= 0)
- **Description**: Points earned for this answer

## Indexes

1. **studentId**: Non-unique index for finding all results by student
2. **quizId**: Non-unique index for finding all results by quiz
3. **Compound (studentId, quizId)**: For efficiently finding a student's attempts on a specific quiz

## Usage Examples

### Creating a Quiz Result

```typescript
import QuizResult from './models/QuizResult';

const quizResult = await QuizResult.create({
  studentId: studentObjectId,
  quizId: quizObjectId,
  answers: [
    {
      questionId: question1Id,
      studentAnswer: 'A programming language',
      isCorrect: true,
      pointsEarned: 10,
    },
    {
      questionId: question2Id,
      studentAnswer: ['TypeScript', 'JavaScript'],
      isCorrect: true,
      pointsEarned: 15,
    },
  ],
  score: 25,
  percentage: 100,
  passed: true,
  attemptNumber: 1,
  submittedAt: new Date(),
  gradedAt: new Date(),
});
```

### Finding Student's Quiz Attempts

```typescript
// Find all attempts by a student for a specific quiz
const attempts = await QuizResult.find({
  studentId: studentId,
  quizId: quizId,
}).sort({ attemptNumber: 1 });

// Find latest attempt
const latestAttempt = await QuizResult.findOne({
  studentId: studentId,
  quizId: quizId,
}).sort({ attemptNumber: -1 });
```

### Finding All Results for a Quiz

```typescript
// Get all student results for a quiz
const results = await QuizResult.find({ quizId: quizId })
  .populate('studentId', 'firstName lastName email')
  .sort({ percentage: -1 });
```

### Populating References

```typescript
// Populate student and quiz information
const result = await QuizResult.findById(resultId)
  .populate('studentId', 'firstName lastName email')
  .populate('quizId', 'title passingScore');
```

## Validation Rules

### Field Validations
- **studentId**: Must reference a valid User document with role 'student'
- **quizId**: Must reference a valid Quiz document
- **answers**: Must be a non-empty array
- **score**: Cannot be negative
- **percentage**: Must be between 0 and 100
- **attemptNumber**: Must be at least 1
- **submittedAt**: Required timestamp
- **gradedAt**: Required timestamp

### Answer Subdocument Validations
- **questionId**: Required
- **studentAnswer**: Must be non-empty string or non-empty array of strings
- **isCorrect**: Required boolean
- **pointsEarned**: Cannot be negative

## Grading Algorithm

The QuizResult model stores the results of the grading algorithm:

1. **Score Calculation**: Sum of pointsEarned from all correct answers
2. **Percentage Calculation**: (score / maximum possible score) * 100
3. **Pass/Fail Determination**: Compare percentage to quiz's passingScore threshold
4. **Attempt Tracking**: Increment attemptNumber for each new submission

## Best Practices

1. **Attempt Tracking**: Always query for existing attempts before creating a new result to determine the correct attemptNumber
2. **Immutability**: Quiz results should generally not be modified after creation (they represent historical records)
3. **Timestamps**: Use submittedAt for when the student submitted and gradedAt for when grading completed
4. **Population**: Populate studentId and quizId when displaying results to users
5. **Indexing**: Use the compound index (studentId, quizId) for efficient attempt queries

## Related Models

- **User**: Referenced by studentId (must have role 'student')
- **Quiz**: Referenced by quizId
- **Question**: Referenced by answers.questionId (subdocument in Quiz)

## JSON Serialization

The model automatically excludes the `__v` field from JSON and object outputs for cleaner API responses.

## Testing

Comprehensive tests are available in `__tests__/QuizResult.test.ts` covering:
- Schema validation
- Subdocument validation
- Scoring and grading
- Attempt tracking
- Timestamps
- Indexes
- Query operations
- Population
- JSON serialization
