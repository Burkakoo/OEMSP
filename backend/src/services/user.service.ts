/**
 * User Service
 * Handles user profile management with Redis caching for high traffic optimization
 */

import User from '../models/User';
import * as redis from '../config/redis.config';
import {
  Permission,
  PermissionMode,
  isPermission,
  resolvePermissions,
} from '../authorization/permissions';

// DTOs and Interfaces
export interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissionMode: PermissionMode;
  customPermissions: Permission[];
  permissions: Permission[];
  profile: {
    avatar?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
  };
  isActive: boolean;
  isEmailVerified: boolean;
  isApproved: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileDTO {
  firstName?: string;
  lastName?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
  };
}

export interface UpdateUserPermissionsDTO {
  permissionMode?: PermissionMode;
  customPermissions?: Permission[];
}

export interface UserSearchFilters {
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  searchTerm?: string; // Search in firstName, lastName, email
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User Service Interface
 */
export interface IUserService {
  getUserProfile(userId: string): Promise<UserProfileDTO>;
  updateUserProfile(userId: string, updates: UpdateUserProfileDTO): Promise<UserProfileDTO>;
  updateUserPermissions(userId: string, updates: UpdateUserPermissionsDTO): Promise<UserProfileDTO>;
  deleteUserAccount(userId: string): Promise<void>;
  setUserActiveStatus(userId: string, isActive: boolean): Promise<UserProfileDTO>;
  searchUsers(filters: UserSearchFilters, pagination: PaginationParams): Promise<PaginatedResult<UserProfileDTO>>;
}

/**
 * User Service Implementation
 * Optimized for high traffic with Redis caching
 */
class UserService implements IUserService {
  private readonly USER_CACHE_PREFIX = 'user:profile:';
  private readonly CACHE_TTL = 300; // 5 minutes cache for user profiles

  /**
   * Get user profile by ID
   * Implements Redis caching for high traffic optimization
   * 
   * @param userId - User ID to fetch
   * @returns UserProfileDTO with user information
   * @throws Error if user not found
   * 
   * Performance optimizations:
   * - Redis caching with 5-minute TTL
   * - Lean queries to reduce memory usage
   * - Selective field projection to minimize data transfer
   */
  async getUserProfile(userId: string): Promise<UserProfileDTO> {
    try {
      // Step 1: Check Redis cache first (high traffic optimization)
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      const cachedProfile = await redis.get(cacheKey);

      if (cachedProfile) {
        // Cache hit - return parsed data
        return JSON.parse(cachedProfile);
      }

      // Step 2: Cache miss - fetch from database
      const user = await User.findById(userId)
        .select('-passwordHash -__v') // Exclude sensitive fields
        .lean() // Return plain JavaScript object for better performance
        .exec();

      if (!user) {
        throw new Error('User not found');
      }

      // Step 3: Map to DTO
      const userProfile = this.mapUserToDTO(user);

      // Step 4: Store in Redis cache for future requests
      await redis.set(
        cacheKey,
        JSON.stringify(userProfile),
        this.CACHE_TTL
      );

      return userProfile;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * Implements Redis cache invalidation for data consistency
   * 
   * @param userId - User ID to update
   * @param updates - Partial user profile updates
   * @returns Updated UserProfileDTO
   * @throws Error if user not found or validation fails
   * 
   * Performance optimizations:
   * - Cache invalidation on update
   * - Selective field updates using $set
   * - Lean query for response
   */
  async updateUserProfile(userId: string, updates: UpdateUserProfileDTO): Promise<UserProfileDTO> {
    try {
      // Step 1: Validate user exists
      const existingUser = await User.findById(userId).lean().exec();
      
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Step 2: Validate updates (basic validation)
      if (updates.firstName !== undefined && updates.firstName.trim().length < 2) {
        throw new Error('First name must be at least 2 characters');
      }

      if (updates.lastName !== undefined && updates.lastName.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters');
      }

      if (updates.profile?.phone && !/^\+?[\d\s\-()]+$/.test(updates.profile.phone)) {
        throw new Error('Invalid phone number format');
      }

      if (updates.profile?.bio && updates.profile.bio.length > 500) {
        throw new Error('Bio must not exceed 500 characters');
      }

      // Step 3: Build update object
      const updateFields: any = {};
      
      if (updates.firstName !== undefined) {
        updateFields.firstName = updates.firstName.trim();
      }
      
      if (updates.lastName !== undefined) {
        updateFields.lastName = updates.lastName.trim();
      }

      if (updates.profile) {
        if (updates.profile.avatar !== undefined) {
          updateFields['profile.avatar'] = updates.profile.avatar;
        }
        if (updates.profile.bio !== undefined) {
          updateFields['profile.bio'] = updates.profile.bio.trim();
        }
        if (updates.profile.phone !== undefined) {
          updateFields['profile.phone'] = updates.profile.phone;
        }
        if (updates.profile.dateOfBirth !== undefined) {
          updateFields['profile.dateOfBirth'] = updates.profile.dateOfBirth;
        }
        if (updates.profile.address) {
          if (updates.profile.address.street !== undefined) {
            updateFields['profile.address.street'] = updates.profile.address.street;
          }
          if (updates.profile.address.city !== undefined) {
            updateFields['profile.address.city'] = updates.profile.address.city;
          }
          if (updates.profile.address.state !== undefined) {
            updateFields['profile.address.state'] = updates.profile.address.state;
          }
          if (updates.profile.address.country !== undefined) {
            updateFields['profile.address.country'] = updates.profile.address.country;
          }
          if (updates.profile.address.postalCode !== undefined) {
            updateFields['profile.address.postalCode'] = updates.profile.address.postalCode;
          }
        }
        if (updates.profile.socialLinks) {
          if (updates.profile.socialLinks.linkedin !== undefined) {
            updateFields['profile.socialLinks.linkedin'] = updates.profile.socialLinks.linkedin;
          }
          if (updates.profile.socialLinks.twitter !== undefined) {
            updateFields['profile.socialLinks.twitter'] = updates.profile.socialLinks.twitter;
          }
          if (updates.profile.socialLinks.github !== undefined) {
            updateFields['profile.socialLinks.github'] = updates.profile.socialLinks.github;
          }
          if (updates.profile.socialLinks.website !== undefined) {
            updateFields['profile.socialLinks.website'] = updates.profile.socialLinks.website;
          }
        }
      }

      // Step 4: Update user in database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      )
        .select('-passwordHash -__v')
        .lean()
        .exec();

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Step 5: Invalidate cache
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await redis.del(cacheKey);

      // Step 6: Map to DTO and cache the updated profile
      const userProfile = this.mapUserToDTO(updatedUser);
      
      await redis.set(
        cacheKey,
        JSON.stringify(userProfile),
        this.CACHE_TTL
      );

      return userProfile;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * Implements soft delete by deactivating the account
   * 
   * @param userId - User ID to delete
   * @throws Error if user not found
   * 
   * Note: This is a soft delete - sets isActive to false
   * Hard delete would require cascading deletion of related data
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Step 1: Validate user exists
      const user = await User.findById(userId).lean().exec();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Step 2: Soft delete - deactivate account
      await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          } 
        }
      ).exec();

      // Step 3: Invalidate cache
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await redis.del(cacheKey);

    } catch (error) {
      console.error('Delete user account error:', error);
      throw error;
    }
  }

  async updateUserPermissions(
    userId: string,
    updates: UpdateUserPermissionsDTO
  ): Promise<UserProfileDTO> {
    try {
      const existingUser = await User.findById(userId).lean().exec();

      if (!existingUser) {
        throw new Error('User not found');
      }

      const updateFields: Record<string, PermissionMode | Permission[] | Date> = {
        updatedAt: new Date(),
      };

      if (updates.permissionMode !== undefined) {
        if (!Object.values(PermissionMode).includes(updates.permissionMode)) {
          throw new Error('Invalid permission mode');
        }

        updateFields.permissionMode = updates.permissionMode;
      }

      if (updates.customPermissions !== undefined) {
        const invalidPermissions = updates.customPermissions.filter(
          (permission) => !isPermission(permission)
        );

        if (invalidPermissions.length > 0) {
          throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
        }

        updateFields.customPermissions = [...new Set(updates.customPermissions)];
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      )
        .select('-passwordHash -__v')
        .lean()
        .exec();

      if (!updatedUser) {
        throw new Error('Failed to update user permissions');
      }

      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await redis.del(cacheKey);

      const userProfile = this.mapUserToDTO(updatedUser);

      await redis.set(cacheKey, JSON.stringify(userProfile), this.CACHE_TTL);

      return userProfile;
    } catch (error) {
      console.error('Update user permissions error:', error);
      throw error;
    }
  }

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<UserProfileDTO> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            isActive,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      )
        .select('-passwordHash -__v')
        .lean()
        .exec();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await redis.del(cacheKey);

      return this.mapUserToDTO(updatedUser);
    } catch (error) {
      console.error('Set user active status error:', error);
      throw error;
    }
  }

  /**
   * Search and list users with filters and pagination
   * 
   * @param filters - Search filters (role, isActive, searchTerm)
   * @param pagination - Pagination parameters (page, limit)
   * @returns Paginated list of users
   */
  async searchUsers(
    filters: UserSearchFilters, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<UserProfileDTO>> {
    try {
      // Step 1: Build query
      const query: any = {};

      if (filters.role) {
        query.role = filters.role;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.isEmailVerified !== undefined) {
        query.isEmailVerified = filters.isEmailVerified;
      }

      if (filters.searchTerm) {
        query.$or = [
          { firstName: { $regex: filters.searchTerm, $options: 'i' } },
          { lastName: { $regex: filters.searchTerm, $options: 'i' } },
          { email: { $regex: filters.searchTerm, $options: 'i' } },
        ];
      }

      // Step 2: Calculate pagination
      const page = Math.max(1, pagination.page);
      const limit = Math.min(100, Math.max(1, pagination.limit)); // Max 100 per page
      const skip = (page - 1) * limit;

      // Step 3: Execute query with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-passwordHash -__v')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        User.countDocuments(query).exec(),
      ]);

      // Step 4: Map to DTOs
      const data = users.map(user => this.mapUserToDTO(user));

      // Step 5: Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Map User document to UserProfileDTO
   * @private
   */
  private mapUserToDTO(user: any): UserProfileDTO {
    const permissionMode = user.permissionMode ?? PermissionMode.INHERIT;
    const customPermissions = Array.isArray(user.customPermissions)
      ? user.customPermissions.filter((permission: string) => isPermission(permission))
      : [];

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissionMode,
      customPermissions,
      permissions: resolvePermissions({
        role: user.role,
        permissionMode,
        customPermissions,
      }),
      profile: {
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        phone: user.profile?.phone,
        dateOfBirth: user.profile?.dateOfBirth,
        address: user.profile?.address,
        socialLinks: user.profile?.socialLinks,
      },
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isApproved: user.isApproved,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
