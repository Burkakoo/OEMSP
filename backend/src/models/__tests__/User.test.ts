import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { UserRole } from '../User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      storageEngine: 'wiredTiger',
    },
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 60000); // Increase timeout to 60 seconds

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000); // Increase timeout for cleanup

afterEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid student user with required fields', async () => {
      const userData = {
        email: 'student@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);

      expect(user.email).toBe('student@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe(UserRole.STUDENT);
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
      expect(user.isApproved).toBe(true); // Students are auto-approved
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should create an instructor user with isApproved defaulting to false', async () => {
      const userData = {
        email: 'instructor@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
      };

      const user = await User.create(userData);

      expect(user.role).toBe(UserRole.INSTRUCTOR);
      expect(user.isApproved).toBe(false); // Instructors require approval
    });

    it('should create an admin user with isApproved defaulting to true', async () => {
      const userData = {
        email: 'admin@example.com',
        passwordHash: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const user = await User.create(userData);

      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.isApproved).toBe(true); // Admins are auto-approved
    });

    it('should fail validation when email is missing', async () => {
      const userData = {
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when email format is invalid', async () => {
      const userData = {
        email: 'invalid-email',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when password is missing', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when firstName is too short', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'J',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when firstName is too long', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'A'.repeat(51),
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when firstName contains invalid characters', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John123',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when lastName is too short', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'D',
        role: UserRole.STUDENT,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation when role is invalid', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid_role',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'UPPERCASE@EXAMPLE.COM',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      expect(user.email).toBe('uppercase@example.com');
    });
  });

  describe('Profile Fields', () => {
    it('should accept valid profile data', async () => {
      const userData = {
        email: 'profile@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Software developer passionate about education',
          phone: '+251912345678',
          dateOfBirth: new Date('1990-01-01'),
          address: {
            street: '123 Main St',
            city: 'Addis Ababa',
            state: 'Addis Ababa',
            country: 'Ethiopia',
            postalCode: '1000',
          },
          socialLinks: {
            linkedin: 'https://linkedin.com/in/johndoe',
            twitter: 'https://twitter.com/johndoe',
            github: 'https://github.com/johndoe',
            website: 'https://johndoe.com',
          },
        },
      };

      const user = await User.create(userData);

      expect(user.profile.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.profile.bio).toBe('Software developer passionate about education');
      expect(user.profile.phone).toBe('+251912345678');
      expect(user.profile.address?.city).toBe('Addis Ababa');
      expect(user.profile.socialLinks?.linkedin).toBe('https://linkedin.com/in/johndoe');
    });

    it('should fail validation for invalid avatar URL', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          avatar: 'not-a-valid-image-url',
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation for bio exceeding 500 characters', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          bio: 'A'.repeat(501),
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation for invalid phone number format', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          phone: 'invalid-phone',
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail validation for invalid LinkedIn URL', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          socialLinks: {
            linkedin: 'https://facebook.com/profile',
          },
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'Password123!';
      const userData = {
        email: 'hash@example.com',
        passwordHash: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);

      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash.length).toBeGreaterThan(50);
      expect(user.passwordHash.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('should use 12 salt rounds for password hashing', async () => {
      const plainPassword = 'Password123!';
      const userData = {
        email: 'salt@example.com',
        passwordHash: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);

      // bcrypt hash format: $2b$[rounds]$[salt+hash]
      const rounds = user.passwordHash.split('$')[2];
      expect(rounds).toBe('12');
    });

    it('should not rehash password if not modified', async () => {
      const userData = {
        email: 'nohash@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const originalHash = user.passwordHash;

      user.firstName = 'Jane';
      await user.save();

      expect(user.passwordHash).toBe(originalHash);
    });

    it('should rehash password when modified', async () => {
      const userData = {
        email: 'rehash@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const originalHash = user.passwordHash;

      user.passwordHash = 'NewPassword456!';
      await user.save();

      expect(user.passwordHash).not.toBe(originalHash);
      expect(user.passwordHash.startsWith('$2b$')).toBe(true);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const plainPassword = 'Password123!';
      const userData = {
        email: 'compare@example.com',
        passwordHash: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword(plainPassword);

      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const plainPassword = 'Password123!';
      const userData = {
        email: 'compare2@example.com',
        passwordHash: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword('WrongPassword456!');

      expect(isMatch).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate strong password', () => {
      const result = User.validatePasswordStrength('Password123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = User.validatePasswordStrength('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = User.validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = User.validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = User.validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = User.validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak password', () => {
      const result = User.validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Instructor Approval Fields', () => {
    it('should allow setting approvedBy and approvedAt fields', async () => {
      const adminUser = await User.create({
        email: 'admin@example.com',
        passwordHash: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });

      const instructorUser = await User.create({
        email: 'instructor@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
      });

      expect(instructorUser.isApproved).toBe(false);

      instructorUser.isApproved = true;
      instructorUser.approvedBy = adminUser._id as mongoose.Types.ObjectId;
      instructorUser.approvedAt = new Date();
      await instructorUser.save();

      expect(instructorUser.isApproved).toBe(true);
      expect(instructorUser.approvedBy).toEqual(adminUser._id);
      expect(instructorUser.approvedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have unique index on email', async () => {
      const indexes = User.schema.indexes();
      const emailIndex = indexes.find((idx: any) => idx[0].email === 1);
      expect(emailIndex).toBeDefined();
      expect(emailIndex?.[1]?.unique).toBe(true);
    });

    it('should have index on role', async () => {
      const indexes = User.schema.indexes();
      const roleIndex = indexes.find((idx: any) => idx[0].role === 1);
      expect(roleIndex).toBeDefined();
    });

    it('should have descending index on createdAt', async () => {
      const indexes = User.schema.indexes();
      const createdAtIndex = indexes.find((idx: any) => idx[0].createdAt === -1);
      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude passwordHash from JSON output', async () => {
      const userData = {
        email: 'json@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.passwordHash).toBeUndefined();
      expect(userJSON.email).toBe('json@example.com');
    });

    it('should exclude __v from JSON output', async () => {
      const userData = {
        email: 'json2@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.__v).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const userData = {
        email: 'timestamp@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on document modification', async () => {
      const userData = {
        email: 'update@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.firstName = 'Jane';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Last Login Tracking', () => {
    it('should allow setting lastLoginAt timestamp', async () => {
      const userData = {
        email: 'login@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const user = await User.create(userData);
      expect(user.lastLoginAt).toBeUndefined();

      const loginTime = new Date();
      user.lastLoginAt = loginTime;
      await user.save();

      expect(user.lastLoginAt).toEqual(loginTime);
    });
  });
});
