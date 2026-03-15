import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Certificate from '../Certificate';
import User, { UserRole } from '../User';
import Course, { CourseLevel } from '../Course';
import Enrollment from '../Enrollment';
import Payment, { PaymentMethod, PaymentStatus } from '../Payment';

let mongoServer: MongoMemoryServer;
let testStudent: any;
let testInstructor: any;
let testCourse: any;
let testPayment: any;
let testEnrollment: any;

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
  testInstructor = await User.create({
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

  // Create test payment
  testPayment = await Payment.create({
    userId: testStudent._id,
    courseId: testCourse._id,
    amount: 99.99,
    currency: 'USD',
    paymentMethod: PaymentMethod.STRIPE,
    status: PaymentStatus.COMPLETED,
    transactionId: 'txn_test_123456',
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    },
  });

  // Create test enrollment
  testEnrollment = await Enrollment.create({
    studentId: testStudent._id,
    courseId: testCourse._id,
    paymentId: testPayment._id,
    completionPercentage: 100,
    isCompleted: true,
    completedAt: new Date(),
  });
});

afterEach(async () => {
  await Certificate.deleteMany({});
  await Enrollment.deleteMany({});
  await Payment.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
});

describe('Certificate Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid certificate with all required fields', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);

      expect(certificate.enrollmentId).toEqual(testEnrollment._id);
      expect(certificate.studentId).toEqual(testStudent._id);
      expect(certificate.courseId).toEqual(testCourse._id);
      expect(certificate.studentName).toBe('John Doe');
      expect(certificate.courseTitle).toBe('Test Course');
      expect(certificate.instructorName).toBe('Jane Smith');
      expect(certificate.completionDate).toBeDefined();
      expect(certificate.verificationCode).toBe('ABCD1234EFGH5678');
      expect(certificate.certificateUrl).toBe('https://example.com/certificates/cert123.pdf');
      expect(certificate.issuedAt).toBeDefined();
      expect(certificate.createdAt).toBeDefined();
      expect(certificate.updatedAt).toBeDefined();
    });

    it('should fail validation when enrollmentId is missing', async () => {
      const certificateData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when studentId is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when courseId is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when studentName is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when courseTitle is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when instructorName is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when completionDate is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when certificateUrl is missing', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });
  });

  describe('Field Validation', () => {
    it('should trim whitespace from studentName', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: '  John Doe  ',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.studentName).toBe('John Doe');
    });

    it('should fail validation when studentName is too short', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'J',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when studentName is too long', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'A'.repeat(201),
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should trim whitespace from courseTitle', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: '  Test Course  ',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.courseTitle).toBe('Test Course');
    });

    it('should fail validation when courseTitle is too short', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when courseTitle is too long', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'A'.repeat(201),
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should trim whitespace from instructorName', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: '  Jane Smith  ',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.instructorName).toBe('Jane Smith');
    });

    it('should fail validation when instructorName is too short', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'J',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when instructorName is too long', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'A'.repeat(201),
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when certificateUrl is not HTTPS', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'http://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should accept valid HTTPS certificateUrl', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://cdn.example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.certificateUrl).toBe('https://cdn.example.com/certificates/cert123.pdf');
    });
  });

  describe('Verification Code Validation', () => {
    it('should accept valid 16-character uppercase alphanumeric verification code', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.verificationCode).toBe('ABCD1234EFGH5678');
    });

    it('should fail validation when verification code is not 16 characters', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when verification code contains lowercase letters', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'abcd1234efgh5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });

    it('should fail validation when verification code contains special characters', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD-1234-EFGH-56',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await expect(Certificate.create(certificateData)).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique enrollmentId constraint', async () => {
      const certificateData1 = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await Certificate.create(certificateData1);

      const certificateData2 = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'WXYZ9876IJKL5432',
        certificateUrl: 'https://example.com/certificates/cert456.pdf',
      };

      await expect(Certificate.create(certificateData2)).rejects.toThrow();
    });

    it('should enforce unique verificationCode constraint', async () => {
      // Create second enrollment for second certificate
      const testPayment2 = await Payment.create({
        userId: testStudent._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_test_789012',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      const testCourse2 = await Course.create({
        title: 'Another Test Course',
        description: 'This is another test course description that meets the minimum length requirement.',
        instructorId: testInstructor._id,
        category: 'Programming',
        level: CourseLevel.INTERMEDIATE,
        price: 149.99,
        isPublished: true,
      });

      const testEnrollment2 = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse2._id,
        paymentId: testPayment2._id,
        completionPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
      });

      const certificateData1 = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      await Certificate.create(certificateData1);

      const certificateData2 = {
        enrollmentId: testEnrollment2._id,
        studentId: testStudent._id,
        courseId: testCourse2._id,
        studentName: 'John Doe',
        courseTitle: 'Another Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678', // Same verification code
        certificateUrl: 'https://example.com/certificates/cert456.pdf',
      };

      await expect(Certificate.create(certificateData2)).rejects.toThrow();
    });
  });

  describe('Verification Code Generation', () => {
    it('should generate a 16-character verification code', () => {
      const code = Certificate.generateVerificationCode();
      expect(code).toHaveLength(16);
    });

    it('should generate uppercase alphanumeric verification code', () => {
      const code = Certificate.generateVerificationCode();
      expect(code).toMatch(/^[A-Z0-9]{16}$/);
    });

    it('should generate unique verification codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(Certificate.generateVerificationCode());
      }
      // All 100 codes should be unique
      expect(codes.size).toBe(100);
    });

    it('should auto-generate verification code if not provided', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.verificationCode).toBeDefined();
      expect(certificate.verificationCode).toHaveLength(16);
      expect(certificate.verificationCode).toMatch(/^[A-Z0-9]{16}$/);
    });
  });

  describe('Timestamps', () => {
    it('should set issuedAt timestamp on creation', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.issuedAt).toBeDefined();
      expect(certificate.issuedAt).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      expect(certificate.createdAt).toBeDefined();
      expect(certificate.updatedAt).toBeDefined();
      expect(certificate.createdAt).toBeInstanceOf(Date);
      expect(certificate.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should have unique index on enrollmentId', async () => {
      const indexes = Certificate.schema.indexes();
      const enrollmentIdIndex = indexes.find(
        (index: any) => index[0].enrollmentId === 1 && index[1].unique === true
      );
      expect(enrollmentIdIndex).toBeDefined();
    });

    it('should have non-unique index on studentId', async () => {
      const indexes = Certificate.schema.indexes();
      const studentIdIndex = indexes.find((index: any) => index[0].studentId === 1);
      expect(studentIdIndex).toBeDefined();
    });

    it('should have unique index on verificationCode', async () => {
      const indexes = Certificate.schema.indexes();
      const verificationCodeIndex = indexes.find(
        (index: any) => index[0].verificationCode === 1 && index[1].unique === true
      );
      expect(verificationCodeIndex).toBeDefined();
    });
  });

  describe('toJSON and toObject transformations', () => {
    it('should exclude __v field in JSON representation', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      const json = certificate.toJSON();
      expect(json.__v).toBeUndefined();
    });

    it('should exclude __v field in object representation', async () => {
      const certificateData = {
        enrollmentId: testEnrollment._id,
        studentId: testStudent._id,
        courseId: testCourse._id,
        studentName: 'John Doe',
        courseTitle: 'Test Course',
        instructorName: 'Jane Smith',
        completionDate: new Date(),
        verificationCode: 'ABCD1234EFGH5678',
        certificateUrl: 'https://example.com/certificates/cert123.pdf',
      };

      const certificate = await Certificate.create(certificateData);
      const obj = certificate.toObject();
      expect(obj.__v).toBeUndefined();
    });
  });
});
