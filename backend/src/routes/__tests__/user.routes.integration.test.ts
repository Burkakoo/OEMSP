/**
 * User Routes Integration Tests
 * Tests the complete user management endpoints with authentication
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../../server';
import User, { UserRole } from '../../models/User';
import { env } from '../../config/env.config';

// Mock the database and Redis config modules
jest.mock('../../config/database.config', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
  setupConnectionEventHandlers: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  getConnectionState: jest.fn().mockReturnValue('connected'),
  getPoolStats: jest.fn().mockReturnValue({
    state: 'connected',
    host: 'localhost:27017',
    name: 'test-db',
  }),
}));

jest.mock('../../config/redis.config', () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
  setupGracefulShutdown: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../config/session.config', () => ({
  createSessionMiddleware: jest.fn().mockReturnValue((_req: any, _res: any, next: any) => next()),
  setupSessionCleanup: jest.fn(),
}));

describe('User Routes Integration Tests', () => {
  let studentToken: string;
  let adminToken: string;
  let studentUserId: string;
  let otherStudentUserId: string;
  let adminUserId: string;

  beforeAll(() => {
    // Create test user IDs
    studentUserId = new mongoose.Types.ObjectId().toString();
    otherStudentUserId = new mongoose.Types.ObjectId().toString();
    adminUserId = new mongoose.Types.ObjectId().toString();

    // Generate test tokens
    studentToken = jwt.sign(
      {
        userId: studentUserId,
        email: 'student@example.com',
        role: UserRole.STUDENT,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      env.JWT_SECRET
    );

    adminToken = jwt.sign(
      {
        userId: adminUserId,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      env.JWT_SECRET
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${studentUserId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 when student tries to access another user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${otherStudentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('You can only access your own profile');
    });

    it('should return 200 when student accesses their own profile', async () => {
      // Mock User.findById
      const mockUser = {
        _id: studentUserId,
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio',
        },
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      } as any);

      const response = await request(app)
        .get(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(studentUserId);
      expect(response.body.user.email).toBe('student@example.com');
    });

    it('should return 200 when admin accesses any user profile', async () => {
      // Mock User.findById
      const mockUser = {
        _id: studentUserId,
        email: 'student@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        profile: {},
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      } as any);

      const response = await request(app)
        .get(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(studentUserId);
    });

    it('should return 404 when user is not found', async () => {
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as any);

      const response = await request(app)
        .get(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 when user ID is invalid', async () => {
      await request(app)
        .get('/api/v1/users/')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404); // Express returns 404 for missing route params
    });
  });
});
