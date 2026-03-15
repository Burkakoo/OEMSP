import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Enrollment Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/v1/enrollments
 * @desc    List enrollments (filtered by role)
 * @access  Private (Student, Instructor, Admin)
 */
router.get('/', authenticate, enrollmentController.listEnrollments);

/**
 * @route   GET /api/v1/enrollments/:id
 * @desc    Get enrollment by ID
 * @access  Private (Student - own only, Instructor, Admin)
 */
router.get('/:id', authenticate, enrollmentController.getEnrollment);

/**
 * @route   POST /api/v1/enrollments
 * @desc    Create new enrollment
 * @access  Private (Student)
 */
router.post('/', authenticate, enrollmentController.createEnrollment);

/**
 * @route   PUT /api/v1/enrollments/:id/progress
 * @desc    Update lesson progress
 * @access  Private (Student - own only)
 */
router.put('/:id/progress', authenticate, enrollmentController.updateProgress);

export default router;
