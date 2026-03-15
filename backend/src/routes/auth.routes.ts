/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 * Public endpoint
 */
router.post('/register', authController.register);

/**
 * POST /api/v1/auth/login
 * Login user
 * Public endpoint
 */
router.post('/login', authController.login);

/**
 * POST /api/v1/auth/logout
 * Logout user
 * Requires authentication
 */
router.post('/logout', authenticate, authController.logout);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 * Public endpoint (uses refresh token from cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * POST /api/v1/auth/reset-password
 * Request password reset
 * Public endpoint
 */
router.post('/reset-password', authController.requestPasswordReset);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 * Requires authentication
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * POST /api/v1/auth/instructors/:id/approve
 * Approve instructor account
 * Requires admin role
 */
router.post(
  '/instructors/:id/approve',
  authenticate,
  requireRole([UserRole.ADMIN]),
  authController.approveInstructor
);

/**
 * POST /api/v1/auth/instructors/:id/reject
 * Reject instructor account
 * Requires admin role
 */
router.post(
  '/instructors/:id/reject',
  authenticate,
  requireRole([UserRole.ADMIN]),
  authController.rejectInstructor
);

/**
 * GET /api/v1/auth/instructors/pending
 * Get list of pending instructor approvals
 * Requires admin role
 */
router.get(
  '/instructors/pending',
  authenticate,
  requireRole([UserRole.ADMIN]),
  authController.getPendingInstructors
);

export default router;
