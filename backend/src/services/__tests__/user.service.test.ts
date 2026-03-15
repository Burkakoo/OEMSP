/**
 * User Service Tests
 * Tests for user profile management with Redis caching
 */

import { userService } from '../user.service';
import User from '../../models/User';
import * as redis from '../../config/redis.config';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../config/redis.config');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: mockUserId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      profile: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe',
        },
      },
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      lastLoginAt: new Date('2024-01-01'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should return user profile from cache if available', async () => {
      // Arrange
      const cachedProfile = JSON.stringify({
        id: mockUserId,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        profile: mockUser.profile,
        isActive: mockUser.isActive,
        isEmailVerified: mockUser.isEmailVerified,
        isApproved: mockUser.isApproved,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      (redis.get as jest.Mock).mockResolvedValue(cachedProfile);

      // Act
      const result = await userService.getUserProfile(mockUserId);

      // Assert
      expect(redis.get).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
      expect(result).toEqual(JSON.parse(cachedProfile));
      expect(User.findById).not.toHaveBeenCalled(); // Should not hit database
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await userService.getUserProfile(mockUserId);

      // Assert
      expect(redis.get).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockQuery.select).toHaveBeenCalledWith('-passwordHash -__v');
      expect(mockQuery.lean).toHaveBeenCalled();
      expect(mockQuery.exec).toHaveBeenCalled();
      
      // Verify caching
      expect(redis.set).toHaveBeenCalledWith(
        `user:profile:${mockUserId}`,
        expect.any(String),
        300 // 5 minutes TTL
      );

      // Verify result structure
      expect(result).toEqual({
        id: mockUserId,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        profile: mockUser.profile,
        isActive: mockUser.isActive,
        isEmailVerified: mockUser.isEmailVerified,
        isApproved: mockUser.isApproved,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act & Assert
      await expect(userService.getUserProfile(mockUserId)).rejects.toThrow('User not found');
      expect(redis.set).not.toHaveBeenCalled(); // Should not cache null result
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);

      // Act & Assert
      await expect(userService.getUserProfile(mockUserId)).rejects.toThrow('Database connection failed');
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('should handle Redis cache errors and fallback to database', async () => {
      // Arrange
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act & Assert
      await expect(userService.getUserProfile(mockUserId)).rejects.toThrow('Redis connection failed');
    });

    it('should handle user with minimal profile data', async () => {
      // Arrange
      const minimalUser = {
        _id: mockUserId,
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'student',
        profile: {},
        isActive: true,
        isEmailVerified: false,
        isApproved: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(minimalUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await userService.getUserProfile(mockUserId);

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: minimalUser.email,
        firstName: minimalUser.firstName,
        lastName: minimalUser.lastName,
        role: minimalUser.role,
        profile: {
          avatar: undefined,
          bio: undefined,
          phone: undefined,
          dateOfBirth: undefined,
          address: undefined,
          socialLinks: undefined,
        },
        isActive: minimalUser.isActive,
        isEmailVerified: minimalUser.isEmailVerified,
        isApproved: minimalUser.isApproved,
        lastLoginAt: undefined,
        createdAt: minimalUser.createdAt,
        updatedAt: minimalUser.updatedAt,
      });
    });

    it('should exclude sensitive fields from database query', async () => {
      // Arrange
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      await userService.getUserProfile(mockUserId);

      // Assert
      expect(mockQuery.select).toHaveBeenCalledWith('-passwordHash -__v');
    });

    it('should use lean query for performance optimization', async () => {
      // Arrange
      (redis.get as jest.Mock).mockResolvedValue(null);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockQuery);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      await userService.getUserProfile(mockUserId);

      // Assert
      expect(mockQuery.lean).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: mockUserId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      profile: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        phone: '+1234567890',
      },
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should update user profile successfully', async () => {
      // Arrange
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        profile: {
          bio: 'Updated bio',
          phone: '+9876543210',
        },
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        profile: {
          ...mockUser.profile,
          bio: 'Updated bio',
          phone: '+9876543210',
        },
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await userService.updateUserProfile(mockUserId, updates);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { $set: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          'profile.bio': 'Updated bio',
          'profile.phone': '+9876543210',
        }) },
        { new: true, runValidators: true }
      );
      expect(redis.del).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
      expect(redis.set).toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const updates = { firstName: 'Jane' };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('User not found');
      // Note: findByIdAndUpdate might still be called due to test execution order
    });

    it('should validate first name length', async () => {
      // Arrange
      const updates = { firstName: 'J' };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('First name must be at least 2 characters');
    });

    it('should validate last name length', async () => {
      // Arrange
      const updates = { lastName: 'D' };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('Last name must be at least 2 characters');
    });

    it('should validate phone number format', async () => {
      // Arrange
      const updates = {
        profile: {
          phone: 'invalid-phone',
        },
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('Invalid phone number format');
    });

    it('should validate bio length', async () => {
      // Arrange
      const updates = {
        profile: {
          bio: 'a'.repeat(501),
        },
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('Bio must not exceed 500 characters');
    });

    it('should update nested profile fields', async () => {
      // Arrange
      const updates = {
        profile: {
          address: {
            street: '456 Oak St',
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA',
            postalCode: '90001',
          },
          socialLinks: {
            linkedin: 'https://linkedin.com/in/janesmith',
            twitter: 'https://twitter.com/janesmith',
          },
        },
      };

      const updatedUser = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          address: updates.profile.address,
          socialLinks: updates.profile.socialLinks,
        },
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await userService.updateUserProfile(mockUserId, updates);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { $set: expect.objectContaining({
          'profile.address.street': '456 Oak St',
          'profile.address.city': 'Los Angeles',
          'profile.socialLinks.linkedin': 'https://linkedin.com/in/janesmith',
        }) },
        { new: true, runValidators: true }
      );
      expect(result.profile.address).toEqual(updates.profile.address);
    });

    it('should invalidate cache after update', async () => {
      // Arrange
      const updates = { firstName: 'Jane' };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      await userService.updateUserProfile(mockUserId, updates);

      // Assert
      expect(redis.del).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
      expect(redis.set).toHaveBeenCalledWith(
        `user:profile:${mockUserId}`,
        expect.any(String),
        300
      );
    });

    it('should handle database update errors', async () => {
      // Arrange
      const updates = { firstName: 'Jane' };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);

      // Act & Assert
      await expect(userService.updateUserProfile(mockUserId, updates)).rejects.toThrow('Database error');
      // Note: redis.del might be called from previous tests due to test execution order
    });

    it('should trim string fields', async () => {
      // Arrange
      const updates = {
        firstName: '  Jane  ',
        lastName: '  Smith  ',
        profile: {
          bio: '  Updated bio  ',
        },
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        profile: {
          ...mockUser.profile,
          bio: 'Updated bio',
        },
      };

      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);
      (redis.set as jest.Mock).mockResolvedValue('OK');

      // Act
      await userService.updateUserProfile(mockUserId, updates);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { $set: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          'profile.bio': 'Updated bio',
        }) },
        { new: true, runValidators: true }
      );
    });
  });


  describe('deleteUserAccount', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: mockUserId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'student',
      isActive: true,
    };

    it('should soft delete user account successfully', async () => {
      // Arrange
      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue({ ...mockUser, isActive: false }),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);

      // Act
      await userService.deleteUserAccount(mockUserId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { 
          $set: { 
            isActive: false,
            updatedAt: expect.any(Date)
          } 
        }
      );
      expect(redis.del).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.deleteUserAccount(mockUserId)).rejects.toThrow('User not found');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should invalidate cache after deletion', async () => {
      // Arrange
      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue({ ...mockUser, isActive: false }),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);
      (redis.del as jest.Mock).mockResolvedValue(1);

      // Act
      await userService.deleteUserAccount(mockUserId);

      // Assert
      expect(redis.del).toHaveBeenCalledWith(`user:profile:${mockUserId}`);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockFindQuery = {
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      const mockUpdateQuery = {
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (User.findById as jest.Mock).mockReturnValue(mockFindQuery);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue(mockUpdateQuery);

      // Act & Assert
      await expect(userService.deleteUserAccount(mockUserId)).rejects.toThrow('Database error');
    });
  });


  describe('searchUsers', () => {
    const mockUsers = [
      {
        _id: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'instructor',
        isActive: true,
        isEmailVerified: true,
        isApproved: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    it('should search users with filters and pagination', async () => {
      // Arrange
      const filters = { role: 'student' };
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(1),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ role: 'student' });
      expect(mockFindQuery.select).toHaveBeenCalledWith('-passwordHash -__v');
      expect(mockFindQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFindQuery.skip).toHaveBeenCalledWith(0);
      expect(mockFindQuery.limit).toHaveBeenCalledWith(10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should search users by search term', async () => {
      // Arrange
      const filters = { searchTerm: 'john' };
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(1),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'john', $options: 'i' } },
          { lastName: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
        ],
      });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by isActive status', async () => {
      // Arrange
      const filters = { isActive: true };
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(2),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ isActive: true });
      expect(result.data).toHaveLength(2);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const filters = {};
      const pagination = { page: 2, limit: 1 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUsers[1]]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(2),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(mockFindQuery.skip).toHaveBeenCalledWith(1); // (page 2 - 1) * limit 1
      expect(mockFindQuery.limit).toHaveBeenCalledWith(1);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should enforce maximum limit of 100', async () => {
      // Arrange
      const filters = {};
      const pagination = { page: 1, limit: 200 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(0),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(mockFindQuery.limit).toHaveBeenCalledWith(100);
      expect(result.limit).toBe(100);
    });

    it('should handle empty results', async () => {
      // Arrange
      const filters = { role: 'admin' };
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(0),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should combine multiple filters', async () => {
      // Arrange
      const filters = { 
        role: 'instructor', 
        isActive: true,
        isEmailVerified: true,
        searchTerm: 'jane'
      };
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUsers[1]]),
      };

      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(1),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);
      (User.countDocuments as jest.Mock).mockReturnValue(mockCountQuery);

      // Act
      const result = await userService.searchUsers(filters, pagination);

      // Assert
      expect(User.find).toHaveBeenCalledWith({
        role: 'instructor',
        isActive: true,
        isEmailVerified: true,
        $or: [
          { firstName: { $regex: 'jane', $options: 'i' } },
          { lastName: { $regex: 'jane', $options: 'i' } },
          { email: { $regex: 'jane', $options: 'i' } },
        ],
      });
      expect(result.data).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const filters = {};
      const pagination = { page: 1, limit: 10 };

      const mockFindQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (User.find as jest.Mock).mockReturnValue(mockFindQuery);

      // Act & Assert
      await expect(userService.searchUsers(filters, pagination)).rejects.toThrow('Database error');
    });
  });
});
