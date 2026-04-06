/**
 * User Routes
 * Defines all user management endpoints
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permission } from '../authorization/permissions';

const router = Router();

/**
 * GET /api/v1/users
 * List/search users (admin only)
 */
router.get('/', authenticate, requirePermission(Permission.USERS_READ), userController.listUsers);

/**
 * GET /api/v1/users/permissions/catalog
 * Return permission metadata and role defaults for admin tooling
 */
router.get(
  '/permissions/catalog',
  authenticate,
  requirePermission(Permission.USERS_READ),
  userController.getPermissionCatalog
);

/**
 * GET /api/v1/users/:id
 * Get user profile by ID
 * Requires authentication
 * Users can access their own profile, admins can access any profile
 */
router.get('/:id', authenticate, userController.getUserProfile);

/**
 * PUT /api/v1/users/:id
 * Update user profile
 * Requires authentication
 * Users can update their own profile, admins can update any profile
 */
router.put('/:id', authenticate, userController.updateUserProfile);

/**
 * PATCH /api/v1/users/:id/status
 * Update a user's active status (admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission(Permission.USERS_MANAGE),
  userController.updateUserStatus
);

/**
 * PATCH /api/v1/users/:id/permissions
 * Update a user's custom permission assignment (admin-only)
 */
router.patch(
  '/:id/permissions',
  authenticate,
  requirePermission(Permission.USERS_MANAGE),
  userController.updateUserPermissions
);

/**
 * DELETE /api/v1/users/:id
 * Delete user account (soft delete)
 * Requires authentication
 * Users can delete their own account, admins can delete any account
 */
router.delete('/:id', authenticate, userController.deleteUserAccount);

export default router;
