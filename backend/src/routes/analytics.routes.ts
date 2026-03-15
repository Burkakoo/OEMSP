import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Analytics Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/v1/analytics/student
 * @desc    Get student dashboard analytics
 * @access  Private (Students only)
 */
router.get('/student', authenticate, analyticsController.getStudentDashboard);

/**
 * @route   GET /api/v1/analytics/instructor
 * @desc    Get instructor dashboard analytics
 * @access  Private (Instructors only)
 */
router.get('/instructor', authenticate, analyticsController.getInstructorDashboard);

/**
 * @route   GET /api/v1/analytics/admin
 * @desc    Get admin dashboard analytics
 * @access  Private (Admin only)
 */
router.get('/admin', authenticate, analyticsController.getAdminDashboard);

/**
 * @route   GET /api/v1/analytics/enrollments
 * @desc    Get enrollment statistics
 * @access  Private (Instructors see own courses, Admins see all)
 */
router.get('/enrollments', authenticate, analyticsController.getEnrollmentStatistics);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue statistics
 * @access  Private (Instructors see own revenue, Admins see all)
 */
router.get('/revenue', authenticate, analyticsController.getRevenueStatistics);

/**
 * @route   GET /api/v1/analytics/quiz-performance
 * @desc    Get quiz performance analytics
 * @access  Private (Students see own performance, Instructors/Admins see all)
 */
router.get('/quiz-performance', authenticate, analyticsController.getQuizPerformanceAnalytics);

export default router;
