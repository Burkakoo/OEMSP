import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Payment, { PaymentMethod, PaymentStatus } from '../Payment';
import User, { UserRole } from '../User';
import Course, { CourseLevel } from '../Course';

let mongoServer: MongoMemoryServer;
let testUser: any;
let testCourse: any;

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
  // Create test user
  testUser = await User.create({
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
});

afterEach(async () => {
  await Payment.deleteMany({});
  await User.deleteMany({});
  await Course.deleteMany({});
});

describe('Payment Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid payment with required fields', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123456',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);

      expect(payment.userId).toEqual(testUser._id);
      expect(payment.courseId).toEqual(testCourse._id);
      expect(payment.amount).toBe(99.99);
      expect(payment.currency).toBe('USD');
      expect(payment.paymentMethod).toBe(PaymentMethod.STRIPE);
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.transactionId).toBe('txn_test_123456');
      expect(payment.metadata.ipAddress).toBe('192.168.1.1');
      expect(payment.metadata.userAgent).toBe('Mozilla/5.0');
      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
      expect(payment.completedAt).toBeUndefined();
      expect(payment.refundedAt).toBeUndefined();
    });

    it('should fail validation when userId is missing', async () => {
      const paymentData = {
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123457',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when courseId is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123458',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when amount is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123459',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when amount is negative', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: -10,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123460',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when amount is zero', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 0,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123461',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when currency is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123462',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when currency is not supported', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'GBP',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_123463',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should accept USD currency', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_usd',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.currency).toBe('USD');
    });

    it('should accept EUR currency', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'EUR',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_eur',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.currency).toBe('EUR');
    });

    it('should accept ETB (Ethiopian Birr) currency', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_test_etb',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+251912345678',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.currency).toBe('ETB');
    });

    it('should convert currency to uppercase', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'usd',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_lowercase',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.currency).toBe('USD');
    });

    it('should fail validation when paymentMethod is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        transactionId: 'txn_test_123464',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when paymentMethod is invalid', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'invalid_method',
        transactionId: 'txn_test_123465',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when transactionId is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should enforce unique transactionId', async () => {
      const paymentData1 = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_duplicate',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const paymentData2 = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 49.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.PAYPAL,
        transactionId: 'txn_duplicate',
        metadata: {
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
        },
      };

      await Payment.create(paymentData1);
      await expect(Payment.create(paymentData2)).rejects.toThrow();
    });

    it('should default status to PENDING', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_default_status',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.status).toBe(PaymentStatus.PENDING);
    });

    it('should accept COMPLETED status', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_test_completed',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        completedAt: new Date(),
      };

      const payment = await Payment.create(paymentData);
      expect(payment.status).toBe(PaymentStatus.COMPLETED);
      expect(payment.completedAt).toBeDefined();
    });

    it('should accept FAILED status', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.FAILED,
        transactionId: 'txn_test_failed',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.status).toBe(PaymentStatus.FAILED);
    });

    it('should accept REFUNDED status', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.REFUNDED,
        transactionId: 'txn_test_refunded',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        refundedAt: new Date(),
      };

      const payment = await Payment.create(paymentData);
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
      expect(payment.refundedAt).toBeDefined();
    });

    it('should fail validation when metadata is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_no_metadata',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when metadata.ipAddress is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_no_ip',
        metadata: {
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation when metadata.userAgent is missing', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_no_ua',
        metadata: {
          ipAddress: '192.168.1.1',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should accept valid IPv4 address', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_ipv4',
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.metadata.ipAddress).toBe('192.168.1.100');
    });

    it('should accept valid IPv6 address', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_ipv6',
        metadata: {
          ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.metadata.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should fail validation with invalid IP address', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_test_invalid_ip',
        metadata: {
          ipAddress: '999.999.999.999',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });
  });

  describe('Payment Methods', () => {
    it('should accept STRIPE payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_stripe',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.STRIPE);
    });

    it('should accept PAYPAL payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.PAYPAL,
        transactionId: 'txn_paypal',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.PAYPAL);
    });

    it('should accept CREDIT_CARD payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionId: 'txn_credit',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should accept DEBIT_CARD payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.DEBIT_CARD,
        transactionId: 'txn_debit',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.DEBIT_CARD);
    });
  });

  describe('Ethiopian Payment Methods', () => {
    it('should accept TELEBIRR payment method with phone number', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_telebirr',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+251912345678',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.TELEBIRR);
      expect(payment.metadata.phoneNumber).toBe('+251912345678');
    });

    it('should accept CBE_BIRR payment method with phone number', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.CBE_BIRR,
        transactionId: 'txn_cbe_birr',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+251923456789',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.CBE_BIRR);
      expect(payment.metadata.phoneNumber).toBe('+251923456789');
    });

    it('should accept CBE payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.CBE,
        transactionId: 'txn_cbe',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.CBE);
    });

    it('should accept AWASH_BANK payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.AWASH_BANK,
        transactionId: 'txn_awash',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.AWASH_BANK);
    });

    it('should accept SIINQEE_BANK payment method', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.SIINQEE_BANK,
        transactionId: 'txn_siinqee',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.paymentMethod).toBe(PaymentMethod.SIINQEE_BANK);
    });

    it('should fail when TELEBIRR payment method is used without phone number', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_telebirr_no_phone',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow(
        'Phone number is required for telebirr payment method'
      );
    });

    it('should fail when CBE_BIRR payment method is used without phone number', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.CBE_BIRR,
        transactionId: 'txn_cbe_birr_no_phone',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow(
        'Phone number is required for cbe_birr payment method'
      );
    });

    it('should fail validation with invalid Ethiopian phone number format', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_invalid_phone',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '0912345678',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation with phone number missing country code', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_no_country_code',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '912345678',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation with phone number having wrong country code', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_wrong_country',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+1234567890',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should fail validation with phone number having incorrect length', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 5000,
        currency: 'ETB',
        paymentMethod: PaymentMethod.TELEBIRR,
        transactionId: 'txn_wrong_length',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+25191234567',
        },
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });
  });

  describe('Static Methods', () => {
    it('should validate correct Ethiopian phone number', () => {
      const result = Payment.validateEthiopianPhoneNumber('+251912345678');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject phone number without country code', () => {
      const result = Payment.validateEthiopianPhoneNumber('912345678');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject phone number with wrong country code', () => {
      const result = Payment.validateEthiopianPhoneNumber('+1234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject phone number with incorrect length', () => {
      const result = Payment.validateEthiopianPhoneNumber('+25191234567');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty phone number', () => {
      const result = Payment.validateEthiopianPhoneNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });
  });

  describe('Indexes', () => {
    it('should have index on userId', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('userId_1');
    });

    it('should have index on courseId', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('courseId_1');
    });

    it('should have index on status', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('status_1');
    });

    it('should have unique index on transactionId', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('transactionId_1');
      expect(indexes.transactionId_1).toEqual([['transactionId', 1]]);
    });

    it('should have index on createdAt', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('createdAt_-1');
    });
  });

  describe('Metadata', () => {
    it('should store gateway response in metadata', async () => {
      const gatewayResponse = {
        transactionId: 'gw_123456',
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_with_gateway',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          gatewayResponse,
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.metadata.gatewayResponse).toEqual(gatewayResponse);
    });

    it('should allow optional phoneNumber in metadata', async () => {
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        transactionId: 'txn_optional_phone',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          phoneNumber: '+251912345678',
        },
      };

      const payment = await Payment.create(paymentData);
      expect(payment.metadata.phoneNumber).toBe('+251912345678');
    });
  });

  describe('Timestamps', () => {
    it('should set completedAt when payment is completed', async () => {
      const completedDate = new Date();
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_completed_timestamp',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        completedAt: completedDate,
      };

      const payment = await Payment.create(paymentData);
      expect(payment.completedAt).toBeDefined();
      expect(payment.completedAt?.getTime()).toBe(completedDate.getTime());
    });

    it('should set refundedAt when payment is refunded', async () => {
      const refundedDate = new Date();
      const paymentData = {
        userId: testUser._id,
        courseId: testCourse._id,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.REFUNDED,
        transactionId: 'txn_refunded_timestamp',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        refundedAt: refundedDate,
      };

      const payment = await Payment.create(paymentData);
      expect(payment.refundedAt).toBeDefined();
      expect(payment.refundedAt?.getTime()).toBe(refundedDate.getTime());
    });
  });
});
