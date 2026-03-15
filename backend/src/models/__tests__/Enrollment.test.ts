import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Enrollment from '../Enrollment';
import User, { UserRole } from '../User';
import Course, { CourseLevel } from '../Course';

let mongoServer: MongoMemoryServer;
let testStudent: any;
let testCourse: any;
let testPaymentId: mongoose.Types.ObjectId;

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
  // Create test student
  testStudent = await User.create({
    email: 'student@example.com',
    passwordHash: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.STUDENT,
  });

  // Create test instructor
  const testInstructor = await User.create({
    email: 'instructor@example.com',
    passwordHash: 'Password123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.INSTRUCTOR,
    isApproved: true,
  });

  // Create test course
  testCourse = await Course.create({
    title: 'Test Course',
    description: 'This is a test course description that meets the minimum length requirement.',
    instructorId: testInstructor._id,
    category: 'Programming',
    level: CourseLevel.BEGINNER,
    price: 99.99,
    isPublished: true,
  });

  // Create test payment ID
  testPaymentId = new mongoose.Types.ObjectId();
});

afterEach(async () => {
  await Enrollment.deleteMany({});
  await User.deleteMany({});
  await Course.deleteMany({});
});

describe('Enrollment Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid enrollment with required fields', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      };

      const enrollment = await Enrollment.create(enrollmentData);

      expect(enrollment.studentId).toEqual(testStudent._id);
      expect(enrollment.courseId).toEqual(testCourse._id);
      expect(enrollment.paymentId).toEqual(testPaymentId);
      expect(enrollment.enrolledAt).toBeDefined();
      expect(enrollment.enrolledAt).toBeInstanceOf(Date);
      expect(enrollment.progress).toEqual([]);
      expect(enrollment.completionPercentage).toBe(0);
      expect(enrollment.isCompleted).toBe(false);
      expect(enrollment.completedAt).toBeUndefined();
      expect(enrollment.certificateId).toBeUndefined();
      expect(enrollment.lastAccessedAt).toBeDefined();
      expect(enrollment.lastAccessedAt).toBeInstanceOf(Date);
      expect(enrollment.createdAt).toBeDefined();
      expect(enrollment.updatedAt).toBeDefined();
    });

    it('should fail validation when studentId is missing', async () => {
      const enrollmentData = {
        courseId: testCourse._id,
        paymentId: testPaymentId,
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should fail validation when courseId is missing', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        paymentId: testPaymentId,
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should fail validation when paymentId is missing', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should enforce unique compound index on (studentId, courseId)', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      };

      await Enrollment.create(enrollmentData);

      // Try to create duplicate enrollment
      const duplicateData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: new mongoose.Types.ObjectId(), // Different payment ID
      };

      await expect(Enrollment.create(duplicateData)).rejects.toThrow();
    });

    it('should allow same student to enroll in different courses', async () => {
      // Create another course
      const testInstructor = await User.findOne({ role: UserRole.INSTRUCTOR });
      const anotherCourse = await Course.create({
        title: 'Another Test Course',
        description: 'This is another test course description that meets the minimum length requirement.',
        instructorId: testInstructor!._id,
        category: 'Programming',
        level: CourseLevel.INTERMEDIATE,
        price: 149.99,
        isPublished: true,
      });

      const enrollment1 = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const enrollment2 = await Enrollment.create({
        studentId: testStudent._id,
        courseId: anotherCourse._id,
        paymentId: new mongoose.Types.ObjectId(),
      });

      expect(enrollment1._id).not.toEqual(enrollment2._id);
      expect(enrollment1.courseId).not.toEqual(enrollment2.courseId);
    });

    it('should allow different students to enroll in same course', async () => {
      const anotherStudent = await User.create({
        email: 'student2@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
      });

      const enrollment1 = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const enrollment2 = await Enrollment.create({
        studentId: anotherStudent._id,
        courseId: testCourse._id,
        paymentId: new mongoose.Types.ObjectId(),
      });

      expect(enrollment1._id).not.toEqual(enrollment2._id);
      expect(enrollment1.studentId).not.toEqual(enrollment2.studentId);
    });
  });

  describe('Completion Percentage Validation', () => {
    it('should accept valid completion percentage (0-100)', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 50,
      });

      expect(enrollment.completionPercentage).toBe(50);
    });

    it('should accept 0% completion', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 0,
      });

      expect(enrollment.completionPercentage).toBe(0);
    });

    it('should accept 100% completion', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 100,
      });

      expect(enrollment.completionPercentage).toBe(100);
    });

    it('should fail validation for negative completion percentage', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: -10,
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should fail validation for completion percentage > 100', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 101,
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });
  });

  describe('Completion Status', () => {
    it('should allow setting isCompleted to true', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      });

      expect(enrollment.isCompleted).toBe(true);
      expect(enrollment.completedAt).toBeDefined();
      expect(enrollment.completedAt).toBeInstanceOf(Date);
    });

    it('should default isCompleted to false', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      expect(enrollment.isCompleted).toBe(false);
    });

    it('should allow setting certificateId when completed', async () => {
      const certificateId = new mongoose.Types.ObjectId();
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
        certificateId: certificateId,
      });

      expect(enrollment.certificateId).toEqual(certificateId);
    });
  });

  describe('Lesson Progress Subdocument', () => {
    it('should create enrollment with lesson progress', async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            lessonId: lessonId,
            completed: true,
            completedAt: new Date(),
            timeSpent: 3600,
          },
        ],
      });

      expect(enrollment.progress).toHaveLength(1);
      expect(enrollment.progress[0]?.lessonId).toEqual(lessonId);
      expect(enrollment.progress[0]?.completed).toBe(true);
      expect(enrollment.progress[0]?.completedAt).toBeDefined();
      expect(enrollment.progress[0]?.timeSpent).toBe(3600);
    });

    it('should create lesson progress with default values', async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            lessonId: lessonId,
          },
        ],
      });

      expect(enrollment.progress[0]?.completed).toBe(false);
      expect(enrollment.progress[0]?.timeSpent).toBe(0);
      expect(enrollment.progress[0]?.completedAt).toBeUndefined();
    });

    it('should fail validation when lessonId is missing in progress', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            completed: true,
            timeSpent: 3600,
          },
        ],
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should fail validation for negative timeSpent', async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            lessonId: lessonId,
            completed: false,
            timeSpent: -100,
          },
        ],
      };

      await expect(Enrollment.create(enrollmentData)).rejects.toThrow();
    });

    it('should allow multiple lesson progress entries', async () => {
      const lesson1Id = new mongoose.Types.ObjectId();
      const lesson2Id = new mongoose.Types.ObjectId();
      const lesson3Id = new mongoose.Types.ObjectId();

      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            lessonId: lesson1Id,
            completed: true,
            completedAt: new Date(),
            timeSpent: 1800,
          },
          {
            lessonId: lesson2Id,
            completed: true,
            completedAt: new Date(),
            timeSpent: 2400,
          },
          {
            lessonId: lesson3Id,
            completed: false,
            timeSpent: 600,
          },
        ],
      });

      expect(enrollment.progress).toHaveLength(3);
      expect(enrollment.progress[0]?.completed).toBe(true);
      expect(enrollment.progress[1]?.completed).toBe(true);
      expect(enrollment.progress[2]?.completed).toBe(false);
    });

    it('should update lesson progress', async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        progress: [
          {
            lessonId: lessonId,
            completed: false,
            timeSpent: 600,
          },
        ],
      });

      expect(enrollment.progress[0]?.completed).toBe(false);

      if (enrollment.progress[0]) {
        enrollment.progress[0].completed = true;
        enrollment.progress[0].completedAt = new Date();
        enrollment.progress[0].timeSpent = 1800;
      }
      await enrollment.save();

      const updated = await Enrollment.findById(enrollment._id);
      expect(updated!.progress[0]?.completed).toBe(true);
      expect(updated!.progress[0]?.completedAt).toBeDefined();
      expect(updated!.progress[0]?.timeSpent).toBe(1800);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set enrolledAt on creation', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      expect(enrollment.enrolledAt).toBeDefined();
      expect(enrollment.enrolledAt).toBeInstanceOf(Date);
    });

    it('should automatically set lastAccessedAt on creation', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      expect(enrollment.lastAccessedAt).toBeDefined();
      expect(enrollment.lastAccessedAt).toBeInstanceOf(Date);
    });

    it('should allow updating lastAccessedAt', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const originalAccessTime = enrollment.lastAccessedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newAccessTime = new Date();
      enrollment.lastAccessedAt = newAccessTime;
      await enrollment.save();

      expect(enrollment.lastAccessedAt.getTime()).toBeGreaterThan(
        originalAccessTime.getTime()
      );
    });

    it('should automatically set createdAt and updatedAt', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      expect(enrollment.createdAt).toBeDefined();
      expect(enrollment.updatedAt).toBeDefined();
      expect(enrollment.createdAt).toBeInstanceOf(Date);
      expect(enrollment.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on document modification', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const originalUpdatedAt = enrollment.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      enrollment.completionPercentage = 50;
      await enrollment.save();

      expect(enrollment.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Indexes', () => {
    it('should have compound unique index on (studentId, courseId)', async () => {
      const indexes = Enrollment.schema.indexes();
      const compoundIndex = indexes.find(
        (idx: any) => idx[0].studentId === 1 && idx[0].courseId === 1
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.[1]?.unique).toBe(true);
    });

    it('should have non-unique index on studentId', async () => {
      const indexes = Enrollment.schema.indexes();
      const studentIdIndex = indexes.find(
        (idx: any) => idx[0].studentId === 1 && !idx[0].courseId
      );
      expect(studentIdIndex).toBeDefined();
    });

    it('should have non-unique index on courseId', async () => {
      const indexes = Enrollment.schema.indexes();
      const courseIdIndex = indexes.find(
        (idx: any) => idx[0].courseId === 1 && !idx[0].studentId
      );
      expect(courseIdIndex).toBeDefined();
    });

    it('should have non-unique index on isCompleted', async () => {
      const indexes = Enrollment.schema.indexes();
      const isCompletedIndex = indexes.find(
        (idx: any) => idx[0].isCompleted === 1
      );
      expect(isCompletedIndex).toBeDefined();
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude __v from JSON output', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const enrollmentJSON = enrollment.toJSON();
      expect(enrollmentJSON.__v).toBeUndefined();
    });

    it('should include all enrollment fields in JSON output', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 75,
      });

      const enrollmentJSON = enrollment.toJSON();
      expect(enrollmentJSON.studentId).toBeDefined();
      expect(enrollmentJSON.courseId).toBeDefined();
      expect(enrollmentJSON.paymentId).toBeDefined();
      expect(enrollmentJSON.completionPercentage).toBe(75);
    });
  });

  describe('Population', () => {
    it('should populate studentId reference', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const populated = await Enrollment.findById(enrollment._id).populate(
        'studentId'
      );

      expect(populated!.studentId).toBeDefined();
      expect((populated!.studentId as any).email).toBe('student@example.com');
    });

    it('should populate courseId reference', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const populated = await Enrollment.findById(enrollment._id).populate(
        'courseId'
      );

      expect(populated!.courseId).toBeDefined();
      expect((populated!.courseId as any).title).toBe('Test Course');
    });

    it('should populate multiple references', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const populated = await Enrollment.findById(enrollment._id)
        .populate('studentId')
        .populate('courseId');

      expect(populated!.studentId).toBeDefined();
      expect(populated!.courseId).toBeDefined();
      expect((populated!.studentId as any).email).toBe('student@example.com');
      expect((populated!.courseId as any).title).toBe('Test Course');
    });
  });

  describe('Query Operations', () => {
    it('should find enrollments by studentId', async () => {
      await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const enrollments = await Enrollment.find({
        studentId: testStudent._id,
      });

      expect(enrollments).toHaveLength(1);
      expect(enrollments[0]?.studentId).toEqual(testStudent._id);
    });

    it('should find enrollments by courseId', async () => {
      await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
      });

      const enrollments = await Enrollment.find({
        courseId: testCourse._id,
      });

      expect(enrollments).toHaveLength(1);
      expect(enrollments[0]?.courseId).toEqual(testCourse._id);
    });

    it('should find completed enrollments', async () => {
      await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      });

      const completedEnrollments = await Enrollment.find({
        isCompleted: true,
      });

      expect(completedEnrollments).toHaveLength(1);
      expect(completedEnrollments[0]?.isCompleted).toBe(true);
      expect(completedEnrollments[0]?.completionPercentage).toBe(100);
    });

    it('should find in-progress enrollments', async () => {
      await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        paymentId: testPaymentId,
        completionPercentage: 50,
        isCompleted: false,
      });

      const inProgressEnrollments = await Enrollment.find({
        isCompleted: false,
        completionPercentage: { $gt: 0 },
      });

      expect(inProgressEnrollments).toHaveLength(1);
      expect(inProgressEnrollments[0]?.isCompleted).toBe(false);
      expect(inProgressEnrollments[0]?.completionPercentage).toBeGreaterThan(0);
    });
  });
});
