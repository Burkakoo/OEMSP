/**
 * User Controller
 * Handles HTTP requests for user management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { userService } from '../services/user.service';

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
    const authenticatedUserRole = req.user?.role;

    // Validate authentication
    if (!authenticatedUserRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Only admins can list users (route should also enforce this)
    if (authenticatedUserRole !== 'admin') {
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
    const authenticatedUserRole = req.user?.role;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserRole) {
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

    // Access control: Users can only access their own profile, admins can access any
    if (authenticatedUserRole !== 'admin' && userId !== authenticatedUserId) {
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
    const authenticatedUserRole = req.user?.role;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserRole) {
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

    // Access control: Users can only update their own profile, admins can update any
    if (authenticatedUserRole !== 'admin' && userId !== authenticatedUserId) {
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
    const authenticatedUserRole = req.user?.role;

    // Validate authentication
    if (!authenticatedUserId || !authenticatedUserRole) {
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

    // Access control: Users can only delete their own account, admins can delete any
    if (authenticatedUserRole !== 'admin' && userId !== authenticatedUserId) {
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
