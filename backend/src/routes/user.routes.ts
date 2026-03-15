/**
 * User Routes
 * Defines all user management endpoints
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

/**
 * GET /api/v1/users
 * List/search users (admin only)
 */
router.get('/', authenticate, requireRole(UserRole.ADMIN), userController.listUsers);

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
 * DELETE /api/v1/users/:id
 * Delete user account (soft delete)
 * Requires authentication
 * Users can delete their own account, admins can delete any account
 */
router.delete('/:id', authenticate, userController.deleteUserAccount);

export default router;
