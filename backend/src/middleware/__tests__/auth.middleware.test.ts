/**
 * Authentication Middleware Tests
 * Tests JWT verification, role-based access control, and resource ownership verification
 */

import { Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  requireOwnership,
  requireSelf,
  optionalAuth,
  AuthRequest,
  AuthenticationError,
} from '../auth.middleware';
import authService, { TokenPayload } from '../../services/auth.service';
import { UserRole } from '../../models/User';

// Mock auth service
jest.mock('../../services/auth.service');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
      cookies: {},
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const validToken = 'valid.jwt.token';
    const validPayload: TokenPayload = {
      userId: 'user123',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    it('should authenticate user with valid Bearer token', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockResolvedValue(validPayload);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.user).toEqual(validPayload);
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should authenticate user with token from cookies', async () => {
      mockRequest.cookies = {
        token: validToken,
      };

      (authService.verifyToken as jest.Mock).mockResolvedValue(validPayload);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.user).toEqual(validPayload);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Token has expired')
      );

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Token has expired',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or revoked token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is revoked', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Token has been revoked')
      );

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or revoked token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should prefer Authorization header over cookies', async () => {
      const headerToken = 'header.token';
      const cookieToken = 'cookie.token';

      mockRequest.headers = {
        authorization: `Bearer ${headerToken}`,
      };
      mockRequest.cookies = {
        token: cookieToken,
      };

      (authService.verifyToken as jest.Mock).mockResolvedValue(validPayload);

      await authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.verifyToken).toHaveBeenCalledWith(headerToken);
      expect(authService.verifyToken).not.toHaveBeenCalledWith(cookieToken);
    });
  });

  describe('requireRole', () => {
    const studentPayload: TokenPayload = {
      userId: 'student123',
      email: 'student@example.com',
      role: UserRole.STUDENT,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    const instructorPayload: TokenPayload = {
      ...studentPayload,
      userId: 'instructor123',
      email: 'instructor@example.com',
      role: UserRole.INSTRUCTOR,
    };

    const adminPayload: TokenPayload = {
      ...studentPayload,
      userId: 'admin123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should allow access for user with required role', () => {
      mockRequest.user = studentPayload;

      const middleware = requireRole(UserRole.STUDENT);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access for user with one of multiple required roles', () => {
      mockRequest.user = instructorPayload;

      const middleware = requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      mockRequest.user = studentPayload;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      // No user attached to request

      const middleware = requireRole(UserRole.STUDENT);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should work with single role as string', () => {
      mockRequest.user = adminPayload;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should work with multiple roles as array', () => {
      mockRequest.user = instructorPayload;

      const middleware = requireRole([
        UserRole.STUDENT,
        UserRole.INSTRUCTOR,
        UserRole.ADMIN,
      ]);
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    const instructorPayload: TokenPayload = {
      userId: 'instructor123',
      email: 'instructor@example.com',
      role: UserRole.INSTRUCTOR,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    const adminPayload: TokenPayload = {
      ...instructorPayload,
      userId: 'admin123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    const mockModel = {
      findById: jest.fn(),
    };

    beforeEach(() => {
      mockModel.findById.mockReset();
    });

    it('should allow access when user owns the resource', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { id: 'course123' };

      const mockResource = {
        _id: 'course123',
        instructorId: 'instructor123',
      };

      mockModel.findById.mockResolvedValue(mockResource);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockModel.findById).toHaveBeenCalledWith('course123');
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access when user does not own the resource', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { id: 'course123' };

      const mockResource = {
        _id: 'course123',
        instructorId: 'otherInstructor456',
      };

      mockModel.findById.mockResolvedValue(mockResource);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to access this resource',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow admin access by default', async () => {
      mockRequest.user = adminPayload;
      mockRequest.params = { id: 'course123' };

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockModel.findById).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should enforce ownership for admin when allowAdmin is false', async () => {
      mockRequest.user = adminPayload;
      mockRequest.params = { id: 'course123' };

      const mockResource = {
        _id: 'course123',
        instructorId: 'instructor123',
      };

      mockModel.findById.mockResolvedValue(mockResource);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
        allowAdmin: false,
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockModel.findById).toHaveBeenCalledWith('course123');
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 404 when resource not found', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { id: 'nonexistent' };

      mockModel.findById.mockResolvedValue(null);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when resource ID parameter is missing', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = {}; // No id parameter

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Missing id parameter',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { courseId: 'course123' };

      const mockResource = {
        _id: 'course123',
        instructorId: 'instructor123',
      };

      mockModel.findById.mockResolvedValue(mockResource);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
        paramName: 'courseId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockModel.findById).toHaveBeenCalledWith('course123');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use custom owner field', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { id: 'quiz123' };

      const mockResource = {
        _id: 'quiz123',
        createdBy: 'instructor123',
      };

      mockModel.findById.mockResolvedValue(mockResource);

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'createdBy',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      // No user attached to request
      mockRequest.params = { id: 'course123' };

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.user = instructorPayload;
      mockRequest.params = { id: 'course123' };

      mockModel.findById.mockRejectedValue(new Error('Database error'));

      const middleware = requireOwnership({
        model: mockModel,
        ownerField: 'instructorId',
      });

      await middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Ownership verification failed',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireSelf', () => {
    const userPayload: TokenPayload = {
      userId: 'user123',
      email: 'user@example.com',
      role: UserRole.STUDENT,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    const adminPayload: TokenPayload = {
      ...userPayload,
      userId: 'admin123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should allow user to access their own profile', () => {
      mockRequest.user = userPayload;
      mockRequest.params = { id: 'user123' };

      const middleware = requireSelf();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny user from accessing another user profile', () => {
      mockRequest.user = userPayload;
      mockRequest.params = { id: 'otherUser456' };

      const middleware = requireSelf();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'You can only access your own profile',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow admin to access any user profile', () => {
      mockRequest.user = adminPayload;
      mockRequest.params = { id: 'anyUser789' };

      const middleware = requireSelf();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', () => {
      mockRequest.user = userPayload;
      mockRequest.params = { userId: 'user123' };

      const middleware = requireSelf('userId');
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 400 when parameter is missing', () => {
      mockRequest.user = userPayload;
      mockRequest.params = {};

      const middleware = requireSelf();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Missing id parameter',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // No user attached to request
      mockRequest.params = { id: 'user123' };

      const middleware = requireSelf();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    const validToken = 'valid.jwt.token';
    const validPayload: TokenPayload = {
      userId: 'user123',
      email: 'test@example.com',
      role: UserRole.STUDENT,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    it('should attach user when valid token is provided', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockResolvedValue(validPayload);

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toEqual(validPayload);
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when no token is provided', async () => {
      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should continue without user when token is expired', async () => {
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Token has expired')
      );

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with default status code 401', () => {
      const error = new AuthenticationError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create error with custom status code', () => {
      const error = new AuthenticationError('Forbidden', 403);

      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });
  });
});
