import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import QuizResult from '../QuizResult';
import Quiz, { QuestionType } from '../Quiz';
import User, { UserRole } from '../User';
import Course, { CourseLevel } from '../Course';

let mongoServer: MongoMemoryServer;
let testStudent: any;
let testQuiz: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      storageEngine: 'wiredTiger',
    },
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

beforeEach(async () => {
  // Create test instructor
  const testInstructor = await User.create({
    email: 'instructor@example.com',
    passwordHash: 'Password123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.INSTRUCTOR,
    isApproved: true,
  });

  // Create test student
  testStudent = await User.create({
    email: 'student@example.com',
    passwordHash: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.STUDENT,
  });

  // Create test course
  const testCourse = await Course.create({
    title: 'Test Course',
    description: 'This is a test course description that meets the minimum length requirement.',
    instructorId: testInstructor._id,
    category: 'Programming',
    level: CourseLevel.BEGINNER,
    price: 99.99,
    isPublished: true,
    modules: [
      {
        title: 'Test Module',
        description: 'This is a test module description',
        order: 0,
        lessons: [],
      },
    ],
  });

  const testModuleId = testCourse.modules[0]?._id;

  // Create test quiz
  testQuiz = await Quiz.create({
    courseId: testCourse._id,
    moduleId: testModuleId,
    title: 'Introduction Quiz',
    description: 'Test your knowledge of the basics',
    questions: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What is TypeScript?',
        options: ['A programming language', 'A database', 'An operating system'],
        correctAnswer: 'A programming language',
        points: 10,
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: 'TypeScript is a typed superset of JavaScript',
        options: [],
        correctAnswer: 'true',
        points: 5,
      },
    ],
    duration: 30,
    passingScore: 70,
    maxAttempts: 3,
  });
});

afterEach(async () => {
  await QuizResult.deleteMany({});
  await Quiz.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
});

describe('QuizResult Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid quiz result with required fields', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'true',
            isCorrect: true,
            pointsEarned: 5,
          },
        ],
        score: 15,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
        submittedAt: new Date(),
        gradedAt: new Date(),
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.studentId).toEqual(testStudent._id);
      expect(quizResult.quizId).toEqual(testQuiz._id);
      expect(quizResult.answers).toHaveLength(2);
      expect(quizResult.score).toBe(15);
      expect(quizResult.percentage).toBe(100);
      expect(quizResult.passed).toBe(true);
      expect(quizResult.attemptNumber).toBe(1);
      expect(quizResult.submittedAt).toBeDefined();
      expect(quizResult.gradedAt).toBeDefined();
      expect(quizResult.createdAt).toBeDefined();
      expect(quizResult.updatedAt).toBeDefined();
    });

    it('should fail validation when studentId is missing', async () => {
      const quizResultData = {
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when quizId is missing', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when answers array is empty', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when score is negative', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: -5,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when percentage is less than 0', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: -10,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when percentage exceeds 100', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 101,
        passed: true,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when attemptNumber is less than 1', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 0,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should accept valid boundary values', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      expect(quizResult.score).toBe(0);
      expect(quizResult.percentage).toBe(0);
      expect(quizResult.attemptNumber).toBe(1);
    });

    it('should accept percentage of 100', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      expect(quizResult.percentage).toBe(100);
    });
  });

  describe('QuizAnswer Subdocument', () => {
    it('should create quiz result with string answer', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.answers[0]?.questionId).toEqual(testQuiz.questions[0]._id);
      expect(quizResult.answers[0]?.studentAnswer).toBe('A programming language');
      expect(quizResult.answers[0]?.isCorrect).toBe(true);
      expect(quizResult.answers[0]?.pointsEarned).toBe(10);
    });

    it('should create quiz result with array answer for multi-select', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: ['TypeScript', 'JavaScript'],
            isCorrect: true,
            pointsEarned: 15,
          },
        ],
        score: 15,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(Array.isArray(quizResult.answers[0]?.studentAnswer)).toBe(true);
      expect(quizResult.answers[0]?.studentAnswer).toEqual(['TypeScript', 'JavaScript']);
    });

    it('should fail validation when studentAnswer is empty string', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: '',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when studentAnswer is empty array', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: [],
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when questionId is missing', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          } as any,
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when isCorrect is missing', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            pointsEarned: 10,
          } as any,
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should fail validation when pointsEarned is negative', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: -5,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      await expect(QuizResult.create(quizResultData)).rejects.toThrow();
    });

    it('should accept pointsEarned of 0 for incorrect answers', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      expect(quizResult.answers[0]?.pointsEarned).toBe(0);
    });
  });

  describe('Multiple Answers', () => {
    it('should create quiz result with multiple answers', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'true',
            isCorrect: true,
            pointsEarned: 5,
          },
        ],
        score: 15,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.answers).toHaveLength(2);
      expect(quizResult.answers[0]?.isCorrect).toBe(true);
      expect(quizResult.answers[1]?.isCorrect).toBe(true);
      expect(quizResult.score).toBe(15);
    });

    it('should handle mixed correct and incorrect answers', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'true',
            isCorrect: true,
            pointsEarned: 5,
          },
        ],
        score: 5,
        percentage: 33.33,
        passed: false,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.answers).toHaveLength(2);
      expect(quizResult.answers[0]?.isCorrect).toBe(false);
      expect(quizResult.answers[1]?.isCorrect).toBe(true);
      expect(quizResult.score).toBe(5);
      expect(quizResult.passed).toBe(false);
    });
  });

  describe('Scoring and Grading', () => {
    it('should correctly store passing result', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'true',
            isCorrect: true,
            pointsEarned: 5,
          },
        ],
        score: 15,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.score).toBe(15);
      expect(quizResult.percentage).toBe(100);
      expect(quizResult.passed).toBe(true);
    });

    it('should correctly store failing result', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'false',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.score).toBe(0);
      expect(quizResult.percentage).toBe(0);
      expect(quizResult.passed).toBe(false);
    });

    it('should handle partial credit scenarios', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
          {
            questionId: testQuiz.questions[1]._id,
            studentAnswer: 'false',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 10,
        percentage: 66.67,
        passed: false,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.score).toBe(10);
      expect(quizResult.percentage).toBeCloseTo(66.67, 2);
      expect(quizResult.passed).toBe(false);
    });
  });

  describe('Attempt Tracking', () => {
    it('should track first attempt', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      expect(quizResult.attemptNumber).toBe(1);
    });

    it('should track multiple attempts', async () => {
      // First attempt
      const firstAttempt = await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'Wrong answer',
            isCorrect: false,
            pointsEarned: 0,
          },
        ],
        score: 0,
        percentage: 0,
        passed: false,
        attemptNumber: 1,
      });

      // Second attempt
      const secondAttempt = await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 2,
      });

      expect(firstAttempt.attemptNumber).toBe(1);
      expect(secondAttempt.attemptNumber).toBe(2);

      // Verify both attempts exist
      const allAttempts = await QuizResult.find({
        studentId: testStudent._id,
        quizId: testQuiz._id,
      }).sort({ attemptNumber: 1 });

      expect(allAttempts).toHaveLength(2);
      expect(allAttempts[0]?.attemptNumber).toBe(1);
      expect(allAttempts[1]?.attemptNumber).toBe(2);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set submittedAt and gradedAt', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.submittedAt).toBeDefined();
      expect(quizResult.gradedAt).toBeDefined();
      expect(quizResult.submittedAt).toBeInstanceOf(Date);
      expect(quizResult.gradedAt).toBeInstanceOf(Date);
    });

    it('should automatically set createdAt and updatedAt', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.createdAt).toBeDefined();
      expect(quizResult.updatedAt).toBeDefined();
      expect(quizResult.createdAt).toBeInstanceOf(Date);
      expect(quizResult.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept custom submittedAt and gradedAt', async () => {
      const customSubmittedAt = new Date('2024-01-01T10:00:00Z');
      const customGradedAt = new Date('2024-01-01T10:05:00Z');

      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
        submittedAt: customSubmittedAt,
        gradedAt: customGradedAt,
      };

      const quizResult = await QuizResult.create(quizResultData);

      expect(quizResult.submittedAt.toISOString()).toBe(customSubmittedAt.toISOString());
      expect(quizResult.gradedAt.toISOString()).toBe(customGradedAt.toISOString());
    });
  });

  describe('Indexes', () => {
    it('should have index on studentId', async () => {
      const indexes = QuizResult.schema.indexes();
      const studentIdIndex = indexes.find((idx: any) => idx[0].studentId === 1 && !idx[0].quizId);
      expect(studentIdIndex).toBeDefined();
    });

    it('should have index on quizId', async () => {
      const indexes = QuizResult.schema.indexes();
      const quizIdIndex = indexes.find((idx: any) => idx[0].quizId === 1 && !idx[0].studentId);
      expect(quizIdIndex).toBeDefined();
    });

    it('should have compound index on studentId and quizId', async () => {
      const indexes = QuizResult.schema.indexes();
      const compoundIndex = indexes.find((idx: any) => idx[0].studentId === 1 && idx[0].quizId === 1);
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude __v from JSON output', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      const json = quizResult.toJSON();

      expect(json.__v).toBeUndefined();
      expect(json._id).toBeDefined();
      expect(json.studentId).toBeDefined();
      expect(json.quizId).toBeDefined();
    });

    it('should exclude __v from object output', async () => {
      const quizResultData = {
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      };

      const quizResult = await QuizResult.create(quizResultData);
      const obj = quizResult.toObject();

      expect(obj.__v).toBeUndefined();
      expect(obj._id).toBeDefined();
      expect(obj.studentId).toBeDefined();
      expect(obj.quizId).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    it('should find quiz results by studentId', async () => {
      await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      });

      const results = await QuizResult.find({ studentId: testStudent._id });

      expect(results).toHaveLength(1);
      expect(results[0]?.studentId).toEqual(testStudent._id);
    });

    it('should find quiz results by quizId', async () => {
      await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      });

      const results = await QuizResult.find({ quizId: testQuiz._id });

      expect(results).toHaveLength(1);
      expect(results[0]?.quizId).toEqual(testQuiz._id);
    });

    it('should find quiz results by studentId and quizId', async () => {
      await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      });

      const results = await QuizResult.find({
        studentId: testStudent._id,
        quizId: testQuiz._id,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.studentId).toEqual(testStudent._id);
      expect(results[0]?.quizId).toEqual(testQuiz._id);
    });

    it('should populate studentId reference', async () => {
      const quizResult = await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      });

      const populated = await QuizResult.findById(quizResult._id).populate('studentId');

      expect(populated?.studentId).toBeDefined();
      expect((populated?.studentId as any).email).toBe('student@example.com');
    });

    it('should populate quizId reference', async () => {
      const quizResult = await QuizResult.create({
        studentId: testStudent._id,
        quizId: testQuiz._id,
        answers: [
          {
            questionId: testQuiz.questions[0]._id,
            studentAnswer: 'A programming language',
            isCorrect: true,
            pointsEarned: 10,
          },
        ],
        score: 10,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
      });

      const populated = await QuizResult.findById(quizResult._id).populate('quizId');

      expect(populated?.quizId).toBeDefined();
      expect((populated?.quizId as any).title).toBe('Introduction Quiz');
    });
  });
});
