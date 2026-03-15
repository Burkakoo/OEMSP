/**
 * Authentication Service Unit Tests
 * Tests all authentication service methods with comprehensive coverage
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../../models/User';
import authService, { RegisterDTO, LoginDTO } from '../auth.service';
import * as redis from '../../config/redis.config';
import { env } from '../../config/env.config';

// Mock Redis
jest.mock('../../config/redis.config');

describe('AuthService', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default Redis mock responses
    (redis.set as jest.Mock).mockResolvedValue('OK');
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.del as jest.Mock).mockResolvedValue(1);
    (redis.exists as jest.Mock).mockResolvedValue(0);
  });

  describe('register', () => {
    it('should successfully register a new student user', async () => {
      const userData: RegisterDTO = {
        email: 'student@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toMatchObject({
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        isApproved: true, // Students are auto-approved
      });

      // Verify user was created in database
      const user = await User.findOne({ email: 'student@example.com' });
      expect(user).toBeDefined();
      expect(user?.isApproved).toBe(true);
    });

    it('should register instructor with isApproved=false', async () => {
      const userData: RegisterDTO = {
        email: 'instructor@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user?.isApproved).toBe(false);

      // Verify in database
      const user = await User.findOne({ email: 'instructor@example.com' });
      expect(user?.isApproved).toBe(false);
    });

    it('should reject registration with invalid email format', async () => {
      const userData: RegisterDTO = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const userData: RegisterDTO = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters');
    });

    it('should reject registration with duplicate email', async () => {
      const userData: RegisterDTO = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      // First registration
      await authService.register(userData);

      // Second registration with same email
      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should store refresh token in Redis', async () => {
      const userData: RegisterDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      await authService.register(userData);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:token:'),
        expect.any(String),
        7 * 24 * 60 * 60 // 7 days in seconds
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test users
      const studentUser = new User({
        email: 'student@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        isActive: true,
        isApproved: true,
      });
      await studentUser.save();

      const instructorUser = new User({
        email: 'instructor@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
        isActive: true,
        isApproved: false, // Not approved yet
      });
      await instructorUser.save();

      const approvedInstructor = new User({
        email: 'approved@example.com',
        passwordHash: 'Password123!',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: UserRole.INSTRUCTOR,
        isActive: true,
        isApproved: true,
      });
      await approvedInstructor.save();
    });

    it('should successfully login with valid credentials', async () => {
      const credentials: LoginDTO = {
        email: 'student@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toMatchObject({
        email: 'student@example.com',
        role: UserRole.STUDENT,
      });
    });

    it('should reject login with invalid email', async () => {
      const credentials: LoginDTO = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      const credentials: LoginDTO = {
        email: 'student@example.com',
        password: 'WrongPassword123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject login for deactivated account', async () => {
      // Deactivate user
      await User.updateOne(
        { email: 'student@example.com' },
        { isActive: false }
      );

      const credentials: LoginDTO = {
        email: 'student@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is deactivated');
    });

    it('should reject login for unapproved instructor', async () => {
      const credentials: LoginDTO = {
        email: 'instructor@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account pending admin approval');
    });

    it('should allow login for approved instructor', async () => {
      const credentials: LoginDTO = {
        email: 'approved@example.com',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should update lastLoginAt timestamp', async () => {
      const credentials: LoginDTO = {
        email: 'student@example.com',
        password: 'Password123!',
      };

      await authService.login(credentials);

      const user = await User.findOne({ email: 'student@example.com' });
      expect(user?.lastLoginAt).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const credentials: LoginDTO = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should blacklist token on logout', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await authService.logout(userId, token);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('blacklist:token:'),
        userId,
        expect.any(Number)
      );
    });

    it('should remove refresh token on logout', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await authService.logout(userId, token);

      expect(redis.del).toHaveBeenCalledWith(
        expect.stringContaining('refresh:token:')
      );
    });

    it('should handle invalid token gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const invalidToken = 'invalid.token.here';

      await expect(authService.logout(userId, invalidToken)).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      (redis.exists as jest.Mock).mockResolvedValue(0); // Not blacklisted

      const payload = await authService.verifyToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe(UserRole.STUDENT);
    });

    it('should reject blacklisted token', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      (redis.exists as jest.Mock).mockResolvedValue(1); // Blacklisted

      await expect(authService.verifyToken(token)).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should reject expired token', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { userId, email: 'test@example.com', role: UserRole.STUDENT },
        env.JWT_SECRET,
        { expiresIn: '0s' } // Expired immediately
      );

      (redis.exists as jest.Mock).mockResolvedValue(0);

      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(authService.verifyToken(token)).rejects.toThrow(
        'Token has expired'
      );
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.verifyToken(invalidToken)).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('refreshToken', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      user = new User({
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        isActive: true,
        isApproved: true,
      });
      await user.save();

      refreshToken = jwt.sign(
        { userId: user._id.toString() },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Mock Redis to return the stored refresh token
      (redis.get as jest.Mock).mockResolvedValue(refreshToken);
    });

    it('should generate new tokens with valid refresh token', async () => {
      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Token rotation - new token should be stored in Redis
      expect(redis.set).toHaveBeenCalled();
    });

    it('should reject invalid refresh token', async () => {
      const invalidToken = 'invalid.refresh.token';

      const result = await authService.refreshToken(invalidToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
    });

    it('should reject refresh token not in Redis', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });

    it('should reject refresh token for inactive user', async () => {
      await User.updateOne({ _id: user._id }, { isActive: false });

      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found or inactive');
    });

    it('should reject refresh token for unapproved instructor', async () => {
      await User.updateOne(
        { _id: user._id },
        { role: UserRole.INSTRUCTOR, isApproved: false }
      );

      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account pending admin approval');
    });
  });

  describe('resetPassword', () => {
    beforeEach(async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });
      await user.save();
    });

    it('should generate reset token for existing user', async () => {
      await authService.resetPassword('test@example.com');

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('password:reset:'),
        expect.any(String),
        3600 // 1 hour
      );
    });

    it('should not throw error for non-existent user', async () => {
      // Should not reveal if user exists
      await expect(
        authService.resetPassword('nonexistent@example.com')
      ).resolves.not.toThrow();
    });
  });

  describe('changePassword', () => {
    let user: any;

    beforeEach(async () => {
      user = new User({
        email: 'test@example.com',
        passwordHash: 'OldPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });
      await user.save();
    });

    it('should successfully change password', async () => {
      await authService.changePassword(
        user._id.toString(),
        'OldPassword123!',
        'NewPassword123!'
      );

      // Verify password was changed
      const updatedUser = await User.findById(user._id);
      const isNewPasswordValid = await updatedUser!.comparePassword('NewPassword123!');
      expect(isNewPasswordValid).toBe(true);
    });

    it('should reject change with incorrect old password', async () => {
      await expect(
        authService.changePassword(
          user._id.toString(),
          'WrongPassword123!',
          'NewPassword123!'
        )
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should reject weak new password', async () => {
      await expect(
        authService.changePassword(
          user._id.toString(),
          'OldPassword123!',
          'weak'
        )
      ).rejects.toThrow();
    });

    it('should invalidate refresh tokens after password change', async () => {
      await authService.changePassword(
        user._id.toString(),
        'OldPassword123!',
        'NewPassword123!'
      );

      expect(redis.del).toHaveBeenCalledWith(
        expect.stringContaining('refresh:token:')
      );
    });

    it('should reject for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        authService.changePassword(fakeId, 'OldPassword123!', 'NewPassword123!')
      ).rejects.toThrow('User not found');
    });
  });

  describe('approveInstructor', () => {
    let instructor: any;
    let adminId: string;

    beforeEach(async () => {
      instructor = new User({
        email: 'instructor@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
        isApproved: false,
      });
      await instructor.save();

      adminId = new mongoose.Types.ObjectId().toString();
    });

    it('should successfully approve instructor', async () => {
      const result = await authService.approveInstructor(
        instructor._id.toString(),
        adminId
      );

      expect(result.isApproved).toBe(true);
      expect(result.approvedBy?.toString()).toBe(adminId);
      expect(result.approvedAt).toBeDefined();
    });

    it('should reject approval for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        authService.approveInstructor(fakeId, adminId)
      ).rejects.toThrow('Instructor not found');
    });

    it('should reject approval for non-instructor user', async () => {
      const student = new User({
        email: 'student@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });
      await student.save();

      await expect(
        authService.approveInstructor(student._id.toString(), adminId)
      ).rejects.toThrow('User is not an instructor');
    });

    it('should reject approval for already approved instructor', async () => {
      await User.updateOne({ _id: instructor._id }, { isApproved: true });

      await expect(
        authService.approveInstructor(instructor._id.toString(), adminId)
      ).rejects.toThrow('Instructor is already approved');
    });
  });

  describe('rejectInstructor', () => {
    let instructor: any;
    let adminId: string;

    beforeEach(async () => {
      instructor = new User({
        email: 'instructor@example.com',
        passwordHash: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.INSTRUCTOR,
        isApproved: false,
      });
      await instructor.save();

      adminId = new mongoose.Types.ObjectId().toString();
    });

    it('should successfully reject instructor', async () => {
      await authService.rejectInstructor(
        instructor._id.toString(),
        adminId,
        'Does not meet requirements'
      );

      const updatedInstructor = await User.findById(instructor._id);
      expect(updatedInstructor?.isActive).toBe(false);
    });

    it('should reject for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        authService.rejectInstructor(fakeId, adminId, 'Test reason')
      ).rejects.toThrow('Instructor not found');
    });

    it('should reject for non-instructor user', async () => {
      const student = new User({
        email: 'student@example.com',
        passwordHash: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      });
      await student.save();

      await expect(
        authService.rejectInstructor(student._id.toString(), adminId, 'Test reason')
      ).rejects.toThrow('User is not an instructor');
    });
  });

  describe('getPendingInstructors', () => {
    beforeEach(async () => {
      // Create pending instructors
      await User.create([
        {
          email: 'pending1@example.com',
          passwordHash: 'Password123!',
          firstName: 'Pending',
          lastName: 'One',
          role: UserRole.INSTRUCTOR,
          isApproved: false,
          isActive: true,
        },
        {
          email: 'pending2@example.com',
          passwordHash: 'Password123!',
          firstName: 'Pending',
          lastName: 'Two',
          role: UserRole.INSTRUCTOR,
          isApproved: false,
          isActive: true,
        },
        {
          email: 'approved@example.com',
          passwordHash: 'Password123!',
          firstName: 'Approved',
          lastName: 'Instructor',
          role: UserRole.INSTRUCTOR,
          isApproved: true,
          isActive: true,
        },
        {
          email: 'student@example.com',
          passwordHash: 'Password123!',
          firstName: 'Student',
          lastName: 'User',
          role: UserRole.STUDENT,
          isApproved: true,
          isActive: true,
        },
      ]);
    });

    it('should return only pending instructors', async () => {
      const pending = await authService.getPendingInstructors();

      expect(pending).toHaveLength(2);
      expect(pending.every(u => u.role === UserRole.INSTRUCTOR)).toBe(true);
      expect(pending.every(u => !u.isApproved)).toBe(true);
      expect(pending.every(u => u.isActive)).toBe(true);
    });

    it('should return empty array when no pending instructors', async () => {
      await User.deleteMany({ isApproved: false });

      const pending = await authService.getPendingInstructors();

      expect(pending).toHaveLength(0);
    });

    it('should sort by creation date descending', async () => {
      const pending = await authService.getPendingInstructors();

      // Verify sorted by createdAt descending (newest first)
      for (let i = 0; i < pending.length - 1; i++) {
        const current = pending[i];
        const next = pending[i + 1];
        if (current && next) {
          expect(current.createdAt.getTime()).toBeGreaterThanOrEqual(
            next.createdAt.getTime()
          );
        }
      }
    });
  });
});
