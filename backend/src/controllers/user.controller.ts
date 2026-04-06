/**
 * User Controller
 * Handles HTTP requests for user management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';
import {
  Permission,
  UserRole,
  getDefaultPermissionsForRole,
  getPermissionCatalog as buildPermissionCatalog,
  hasPermission,
} from '../authorization/permissions';
import { createAuditLog } from '../services/auditLog.service';

/**
 * List/search users (admin only)
 * GET /api/v1/users
 *
 * Access control:
 * - Admins can list/search all users
 *
 * Supports:
 * - Pagination: page, limit
 * - Filters: role, isActive, isEmailVerified
 * - Search: searchTerm (firstName, lastName, email)
 */
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authenticatedUserPermissions = req.user?.permissions;

    // Validate authentication
    if (!authenticatedUserPermissions) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!hasPermission(authenticatedUserPermissions, Permission.USERS_READ)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const filters = {
      role: req.query.role as string | undefined,
      isActive:
        req.query.isActive === 'true'
          ? true
          : req.query.isActive === 'false'
            ? false
            : undefined,
      isEmailVerified:
        req.query.isEmailVerified === 'true'
          ? true
          : req.query.isEmailVerified === 'false'
            ? false
            : undefined,
      searchTerm: (req.query.searchTerm as string) || (req.query.search as string) || undefined,
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await userService.searchUsers(filters, pagination);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('List users controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('must be')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Get user profile by ID
 * GET /api/v1/users/:id
 * 
 * Access control:
 * - Users can access their own profile
 * - Admins can access any user profile
 * 
 * Requirements:
 * - 1.9.1: Students shall update their own profile
 * - 1.9.3: Admins shall access all system resources
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const authenticatedUserId = req.user?.userId;
    const authenticatedUserPermissions = req.user?.permissions;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserPermissions) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate user ID parameter
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const canAccessOtherProfiles = hasPermission(
      authenticatedUserPermissions,
      Permission.USERS_READ
    );

    if (userId !== authenticatedUserId && !canAccessOtherProfiles) {
      res.status(403).json({
        success: false,
        error: 'You can only access your own profile',
      });
      return;
    }

    // Get user profile from service
    const userProfile = await userService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    console.error('Get user profile controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const getPermissionCatalog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!hasPermission(req.user?.permissions, Permission.USERS_READ)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        permissions: buildPermissionCatalog(),
        roleDefaults: (Object.values(UserRole) as UserRole[]).map((role) => ({
          role,
          defaultPermissions: getDefaultPermissionsForRole(role),
        })),
      },
    });
  } catch (error) {
    console.error('Get permission catalog controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load permission catalog',
    });
  }
};
/**
 * Update user profile
 * PUT /api/v1/users/:id
 *
 * Access control:
 * - Users can update their own profile
 * - Admins can update any user profile
 *
 * Requirements:
 * - 1.1.5: Users shall update profile information
 * - 1.9.1: Students shall update their own profile
 * - 1.9.3: Admins shall access all system resources
 */
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const authenticatedUserId = req.user?.userId;
    const authenticatedUserPermissions = req.user?.permissions;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserPermissions) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate user ID parameter
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const canManageOtherProfiles = hasPermission(
      authenticatedUserPermissions,
      Permission.USERS_MANAGE
    );

    if (userId !== authenticatedUserId && !canManageOtherProfiles) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own profile',
      });
      return;
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Update data is required',
      });
      return;
    }

    // Update user profile through service
    const updatedProfile = await userService.updateUserProfile(userId, req.body);

    res.status(200).json({
      success: true,
      user: updatedProfile,
    });
  } catch (error) {
    console.error('Update user profile controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    // Determine status code based on error message
    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (
      errorMessage.includes('must be') ||
      errorMessage.includes('Invalid') ||
      errorMessage.includes('must not exceed')
    ) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};


/**
 * Delete user account
 * DELETE /api/v1/users/:id
 * 
 * Access control:
 * - Users can delete their own account
 * - Admins can delete any user account
 * 
 * Requirements:
 * - 4.1.3: Create delete user account function
 * - 1.9.1: Students shall update their own profile
 * - 1.9.3: Admins shall access all system resources
 * 
 * Note: This performs a soft delete by deactivating the account
 */
export const deleteUserAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const authenticatedUserId = req.user?.userId;
    const authenticatedUserPermissions = req.user?.permissions;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserPermissions) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate user ID parameter
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const canManageOtherProfiles = hasPermission(
      authenticatedUserPermissions,
      Permission.USERS_MANAGE
    );

    if (userId !== authenticatedUserId && !canManageOtherProfiles) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own account',
      });
      return;
    }

    // Delete user account through service
    await userService.deleteUserAccount(userId);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Delete user account controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!hasPermission(req.user?.permissions, Permission.USERS_MANAGE)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const rawUserId = req.params.id;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const { isActive } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'isActive must be a boolean',
      });
      return;
    }

    const user = await userService.setUserActiveStatus(userId, isActive);

    res.status(200).json({
      success: true,
      user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Update user status controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only administrators can assign permissions',
      });
      return;
    }

    const rawUserId = req.params.id;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const { permissionMode, customPermissions } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    if (permissionMode === undefined && customPermissions === undefined) {
      res.status(400).json({
        success: false,
        error: 'permissionMode or customPermissions must be provided',
      });
      return;
    }

    const previousUser = await userService.getUserProfile(userId);
    const user = await userService.updateUserPermissions(userId, {
      permissionMode,
      customPermissions,
    });

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;

    void createAuditLog({
      userId: req.user?.userId,
      action: 'UPDATE_USER_PERMISSIONS',
      resource: 'users',
      resourceId: userId,
      method: 'PATCH',
      path: req.path,
      statusCode: 200,
      success: true,
      ipAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        targetUserId: userId,
        changedByUserId: req.user?.userId,
        before: {
          permissionMode: previousUser.permissionMode,
          customPermissions: previousUser.customPermissions,
          permissions: previousUser.permissions,
        },
        after: {
          permissionMode: user.permissionMode,
          customPermissions: user.customPermissions,
          permissions: user.permissions,
        },
      },
    }).catch((auditError) => {
      console.error('Failed to create permission change audit log:', auditError);
    });

    res.status(200).json({
      success: true,
      user,
      message: 'User permissions updated successfully',
    });
  } catch (error) {
    console.error('Update user permissions controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 400;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('Failed')) {
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};
