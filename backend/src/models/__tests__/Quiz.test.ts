import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Quiz, { QuestionType } from '../Quiz';
import User, { UserRole } from '../User';
import Course, { CourseLevel } from '../Course';

let mongoServer: MongoMemoryServer;
let testCourse: any;
let testModuleId: mongoose.Types.ObjectId;

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

  // Create test course with a module
  testCourse = await Course.create({
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

  testModuleId = testCourse.modules[0]._id;
});

afterEach(async () => {
  await Quiz.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
});

describe('Quiz Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid quiz with required fields', async () => {
      const quizData = {
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
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.courseId).toEqual(testCourse._id);
      expect(quiz.moduleId).toEqual(testModuleId);
      expect(quiz.title).toBe('Introduction Quiz');
      expect(quiz.description).toBe('Test your knowledge of the basics');
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.duration).toBe(30);
      expect(quiz.passingScore).toBe(70);
      expect(quiz.maxAttempts).toBe(3);
      expect(quiz.isPublished).toBe(false);
      expect(quiz.createdAt).toBeDefined();
      expect(quiz.updatedAt).toBeDefined();
    });

    it('should fail validation when courseId is missing', async () => {
      const quizData = {
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when title is too short', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when title is too long', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'A'.repeat(201),
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when description is too short', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Short',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when quiz has no questions', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when duration is less than 1', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 0,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when duration exceeds 300 minutes', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 301,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when passingScore is negative', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: -10,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when passingScore exceeds 100', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 101,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when maxAttempts is less than 1', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 0,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when maxAttempts exceeds 10', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 11,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should accept valid boundary values', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 300,
        passingScore: 100,
        maxAttempts: 10,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.duration).toBe(300);
      expect(quiz.passingScore).toBe(100);
      expect(quiz.maxAttempts).toBe(10);
    });
  });

  describe('Question Subdocument - Multiple Choice', () => {
    it('should create quiz with multiple choice question', async () => {
      const quizData = {
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
            explanation: 'TypeScript is a typed superset of JavaScript',
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.questions[0]?.type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(quiz.questions[0]?.text).toBe('What is TypeScript?');
      expect(quiz.questions[0]?.options).toHaveLength(3);
      expect(quiz.questions[0]?.correctAnswer).toBe('A programming language');
      expect(quiz.questions[0]?.points).toBe(10);
      expect(quiz.questions[0]?.explanation).toBe('TypeScript is a typed superset of JavaScript');
    });

    it('should fail validation when multiple choice has less than 2 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when multiple choice has more than 6 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7'],
            correctAnswer: 'Option 1',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should accept multiple choice with 2 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Is TypeScript a programming language?',
            options: ['Yes', 'No'],
            correctAnswer: 'Yes',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.questions[0]?.options).toHaveLength(2);
    });

    it('should accept multiple choice with 6 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6'],
            correctAnswer: 'Option 1',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.questions[0]?.options).toHaveLength(6);
    });
  });

  describe('Question Subdocument - True/False', () => {
    it('should create quiz with true/false question', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
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
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.questions[0]?.type).toBe(QuestionType.TRUE_FALSE);
      expect(quiz.questions[0]?.text).toBe('TypeScript is a typed superset of JavaScript');
      expect(quiz.questions[0]?.options).toHaveLength(0);
      expect(quiz.questions[0]?.correctAnswer).toBe('true');
      expect(quiz.questions[0]?.points).toBe(5);
    });

    it('should accept true/false with 2 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.TRUE_FALSE,
            text: 'TypeScript is a typed superset of JavaScript',
            options: ['True', 'False'],
            correctAnswer: 'True',
            points: 5,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.questions[0]?.options).toHaveLength(2);
    });
  });

  describe('Question Subdocument - Multi-Select', () => {
    it('should create quiz with multi-select question', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTI_SELECT,
            text: 'Which of the following are programming languages?',
            options: ['TypeScript', 'HTML', 'JavaScript', 'CSS'],
            correctAnswer: ['TypeScript', 'JavaScript'],
            points: 15,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.questions[0]?.type).toBe(QuestionType.MULTI_SELECT);
      expect(quiz.questions[0]?.correctAnswer).toEqual(['TypeScript', 'JavaScript']);
      expect(Array.isArray(quiz.questions[0]?.correctAnswer)).toBe(true);
    });

    it('should fail validation when multi-select has less than 2 options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTI_SELECT,
            text: 'Which of the following are programming languages?',
            options: ['TypeScript'],
            correctAnswer: ['TypeScript'],
            points: 15,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when multi-select correctAnswer is not an array', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTI_SELECT,
            text: 'Which of the following are programming languages?',
            options: ['TypeScript', 'HTML', 'JavaScript'],
            correctAnswer: 'TypeScript',
            points: 15,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });
  });

  describe('Question Subdocument - Short Answer', () => {
    it('should create quiz with short answer question', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.SHORT_ANSWER,
            text: 'What does TypeScript compile to?',
            options: [],
            correctAnswer: 'JavaScript',
            points: 20,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.questions[0]?.type).toBe(QuestionType.SHORT_ANSWER);
      expect(quiz.questions[0]?.options).toHaveLength(0);
      expect(quiz.questions[0]?.correctAnswer).toBe('JavaScript');
    });

    it('should fail validation when short answer has options', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.SHORT_ANSWER,
            text: 'What does TypeScript compile to?',
            options: ['JavaScript', 'Python'],
            correctAnswer: 'JavaScript',
            points: 20,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });
  });

  describe('Question Validation', () => {
    it('should fail validation when question text is too short', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 'Option 1',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should fail validation when question points are zero or negative', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 0,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });

    it('should accept decimal points', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 5.5,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.questions[0]?.points).toBe(5.5);
    });

    it('should fail validation when question type is invalid', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: 'invalid_type' as any,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      await expect(Quiz.create(quizData)).rejects.toThrow();
    });
  });

  describe('Multiple Questions', () => {
    it('should create quiz with multiple questions of different types', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Comprehensive Quiz',
        description: 'Test your knowledge with various question types',
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
          {
            type: QuestionType.MULTI_SELECT,
            text: 'Which are valid TypeScript types?',
            options: ['string', 'number', 'boolean', 'color'],
            correctAnswer: ['string', 'number', 'boolean'],
            points: 15,
          },
          {
            type: QuestionType.SHORT_ANSWER,
            text: 'What does TypeScript compile to?',
            options: [],
            correctAnswer: 'JavaScript',
            points: 20,
          },
        ],
        duration: 60,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.questions).toHaveLength(4);
      expect(quiz.questions[0]?.type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(quiz.questions[1]?.type).toBe(QuestionType.TRUE_FALSE);
      expect(quiz.questions[2]?.type).toBe(QuestionType.MULTI_SELECT);
      expect(quiz.questions[3]?.type).toBe(QuestionType.SHORT_ANSWER);
    });
  });

  describe('Indexes', () => {
    it('should have index on courseId', async () => {
      const indexes = Quiz.schema.indexes();
      const courseIdIndex = indexes.find((idx: any) => idx[0].courseId === 1);
      expect(courseIdIndex).toBeDefined();
    });

    it('should have index on moduleId', async () => {
      const indexes = Quiz.schema.indexes();
      const moduleIdIndex = indexes.find((idx: any) => idx[0].moduleId === 1);
      expect(moduleIdIndex).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should set isPublished to false by default', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.isPublished).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);

      expect(quiz.createdAt).toBeDefined();
      expect(quiz.updatedAt).toBeDefined();
      expect(quiz.createdAt).toBeInstanceOf(Date);
      expect(quiz.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on document modification', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      const originalUpdatedAt = quiz.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      quiz.title = 'Updated Quiz Title';
      await quiz.save();

      expect(quiz.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude __v from JSON output', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      const quizJSON = quiz.toJSON();

      expect(quizJSON.__v).toBeUndefined();
      expect(quizJSON.title).toBe('Introduction Quiz');
    });
  });

  describe('Question Types Enum', () => {
    it('should accept all valid question types', async () => {
      const questionTypes = [
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.TRUE_FALSE,
        QuestionType.MULTI_SELECT,
        QuestionType.SHORT_ANSWER,
      ];

      for (const type of questionTypes) {
        const quizData = {
          courseId: testCourse._id,
          moduleId: testModuleId,
          title: `Quiz for ${type}`,
          description: 'Test your knowledge of the basics',
          questions: [
            {
              type,
              text: 'Sample question text for testing',
              options: type === QuestionType.SHORT_ANSWER ? [] : ['Option 1', 'Option 2'],
              correctAnswer: type === QuestionType.MULTI_SELECT ? ['Option 1'] : 'Option 1',
              points: 10,
            },
          ],
          duration: 30,
          passingScore: 70,
          maxAttempts: 3,
        };

        const quiz = await Quiz.create(quizData);
        expect(quiz.questions[0]?.type).toBe(type);
        await Quiz.deleteMany({});
      }
    });
  });

  describe('Population', () => {
    it('should populate courseId reference', async () => {
      const quizData = {
        courseId: testCourse._id,
        moduleId: testModuleId,
        title: 'Introduction Quiz',
        description: 'Test your knowledge of the basics',
        questions: [
          {
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'What is TypeScript?',
            options: ['A programming language', 'A database'],
            correctAnswer: 'A programming language',
            points: 10,
          },
        ],
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
      };

      const quiz = await Quiz.create(quizData);
      const populated = await Quiz.findById(quiz._id).populate('courseId');

      expect(populated!.courseId).toBeDefined();
      expect((populated!.courseId as any).title).toBe('Test Course');
    });
  });
});
