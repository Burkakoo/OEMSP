/**
 * User Controller Tests
 * Unit tests for user management endpoint handlers
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getUserProfile, updateUserProfile, deleteUserAccount } from '../user.controller';
import { userService, UserProfileDTO } from '../../services/user.service';
import { UserRole } from '../../models/User';

// Mock the user service
jest.mock('../../services/user.service');

describe('User Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock response
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe('getUserProfile', () => {
    const mockUserProfile: UserProfileDTO = {
      id: '507f1f77bcf86cd799439011',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      profile: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software developer',
        phone: '+1234567890',
      },
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    };

    it('should return user profile when user accesses their own profile', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        user: mockUserProfile,
      });
    });

    it('should return user profile when admin accesses any user profile', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const adminUserId = '507f1f77bcf86cd799439012';
      mockRequest = {
        params: { id: targetUserId },
        user: {
          userId: adminUserId,
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).toHaveBeenCalledWith(targetUserId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        user: mockUserProfile,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: undefined,
      };

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return 403 when non-admin user tries to access another user profile', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const requestingUserId = '507f1f77bcf86cd799439012';
      mockRequest = {
        params: { id: targetUserId },
        user: {
          userId: requestingUserId,
          email: 'other.user@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'You can only access your own profile',
      });
    });

    it('should return 400 when user ID is missing', async () => {
      // Arrange
      mockRequest = {
        params: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required',
      });
    });

    it('should return 404 when user is not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.getUserProfile as jest.Mock).mockRejectedValue('Unknown error');

      // Act
      await getUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('updateUserProfile', () => {
    const mockUserProfile: UserProfileDTO = {
      id: '507f1f77bcf86cd799439011',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      profile: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Updated bio',
        phone: '+1234567890',
      },
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    };

    it('should update user profile when user updates their own profile', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const updateData = {
        firstName: 'John',
        profile: {
          bio: 'Updated bio',
        },
      };

      mockRequest = {
        params: { id: userId },
        body: updateData,
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(userId, updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        user: mockUserProfile,
      });
    });

    it('should update user profile when admin updates any user profile', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const adminUserId = '507f1f77bcf86cd799439012';
      const updateData = {
        firstName: 'John',
        profile: {
          bio: 'Updated by admin',
        },
      };

      mockRequest = {
        params: { id: targetUserId },
        body: updateData,
        user: {
          userId: adminUserId,
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(targetUserId, updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        user: mockUserProfile,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { firstName: 'John' },
        user: undefined,
      };

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return 403 when non-admin user tries to update another user profile', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const requestingUserId = '507f1f77bcf86cd799439012';
      mockRequest = {
        params: { id: targetUserId },
        body: { firstName: 'John' },
        user: {
          userId: requestingUserId,
          email: 'other.user@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'You can only update your own profile',
      });
    });

    it('should return 400 when user ID is missing', async () => {
      // Arrange
      mockRequest = {
        params: {},
        body: { firstName: 'John' },
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required',
      });
    });

    it('should return 400 when update data is empty', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        body: {},
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Update data is required',
      });
    });

    it('should return 404 when user is not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        body: { firstName: 'John' },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.updateUserProfile as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        body: { firstName: 'J' },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.updateUserProfile as jest.Mock).mockRejectedValue(
        new Error('First name must be at least 2 characters')
      );

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'First name must be at least 2 characters',
      });
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        body: { firstName: 'John' },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.updateUserProfile as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await updateUserProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete user account when user deletes their own account', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.deleteUserAccount as jest.Mock).mockResolvedValue(undefined);

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'User account deleted successfully',
      });
    });

    it('should delete user account when admin deletes any user account', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const adminUserId = '507f1f77bcf86cd799439012';
      mockRequest = {
        params: { id: targetUserId },
        user: {
          userId: adminUserId,
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.deleteUserAccount as jest.Mock).mockResolvedValue(undefined);

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).toHaveBeenCalledWith(targetUserId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'User account deleted successfully',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockRequest = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: undefined,
      };

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return 403 when non-admin user tries to delete another user account', async () => {
      // Arrange
      const targetUserId = '507f1f77bcf86cd799439011';
      const requestingUserId = '507f1f77bcf86cd799439012';
      mockRequest = {
        params: { id: targetUserId },
        user: {
          userId: requestingUserId,
          email: 'other.user@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'You can only delete your own account',
      });
    });

    it('should return 400 when user ID is missing', async () => {
      // Arrange
      mockRequest = {
        params: {},
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required',
      });
    });

    it('should return 404 when user is not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.deleteUserAccount as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      mockRequest = {
        params: { id: userId },
        user: {
          userId: userId,
          email: 'john.doe@example.com',
          role: UserRole.STUDENT,
          iat: Date.now(),
          exp: Date.now() + 86400,
        },
      };

      (userService.deleteUserAccount as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await deleteUserAccount(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(userService.deleteUserAccount).toHaveBeenCalledWith(userId);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });
  });
});
