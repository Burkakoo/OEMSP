/**
 * Course Routes
 * Defines all course management endpoints
 */

import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import * as enrollmentController from '../controllers/enrollment.controller';
import * as quizController from '../controllers/quiz.controller';
import * as moduleController from '../controllers/module.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/courses
 * List courses with filters and pagination
 * Public endpoint (authentication optional)
 * - Shows only published courses to non-instructors
 * - Instructors can see their own unpublished courses
 */
router.get('/', optionalAuth, courseController.listCourses);

/**
 * POST /api/v1/courses
 * Create a new course
 * Requires authentication (instructor only)
 */
router.post('/', authenticate, courseController.createCourse);

/**
 * POST /api/v1/courses/:courseId/quizzes
 * Create a new quiz for a course
 * Requires authentication (instructor only - course owner)
 */
router.post('/:courseId/quizzes', authenticate, quizController.createQuiz);

/**
 * GET /api/v1/courses/:courseId/quizzes
 * List quizzes for a course
 * Requires authentication
 * - Students: published quizzes only, must be enrolled
 * - Instructors/Admins: can include unpublished with ?includeUnpublished=true
 */
router.get('/:courseId/quizzes', authenticate, quizController.listCourseQuizzes);

/**
 * POST /api/v1/courses/:courseId/modules
 * Add a module to a course
 * Requires authentication (course owner only)
 */
router.post('/:courseId/modules', authenticate, moduleController.addModule);

/**
 * POST /api/v1/courses/:courseId/modules/:moduleId/lessons
 * Add a lesson to a module
 * Requires authentication (course owner only)
 */
router.post('/:courseId/modules/:moduleId/lessons', authenticate, moduleController.addLesson);

/**
 * GET /api/v1/courses/:id
 * Get course by ID
 * Public endpoint for published courses (authentication optional)
 * - Unpublished courses require authentication and ownership
 */
router.get('/:id', optionalAuth, courseController.getCourse);

/**
 * PUT /api/v1/courses/:id
 * Update a course
 * Requires authentication (course owner only)
 */
router.put('/:id', authenticate, courseController.updateCourse);

/**
 * DELETE /api/v1/courses/:id
 * Delete a course
 * Requires authentication (course owner only)
 */
router.delete('/:id', authenticate, courseController.deleteCourse);

/**
 * POST /api/v1/courses/:id/publish
 * Publish a course
 * Requires authentication (course owner only)
 */
router.post('/:id/publish', authenticate, courseController.publishCourse);

/**
 * POST /api/v1/courses/:id/unpublish
 * Unpublish a course
 * Requires authentication (course owner only)
 */
router.post('/:id/unpublish', authenticate, courseController.unpublishCourse);

/**
 * GET /api/v1/courses/:id/enrollments
 * Get enrollments for a course
 * Requires authentication (instructor or admin only)
 */
router.get('/:id/enrollments', authenticate, enrollmentController.getCourseEnrollments);

export default router;
