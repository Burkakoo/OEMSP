/**
 * Module and Lesson Routes
 * Defines all module and lesson management endpoints
 */

import { Router } from 'express';
import * as moduleController from '../controllers/module.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/v1/courses/:courseId/modules
 * Add a module to a course
 * Requires authentication (course owner only)
 */
router.post('/courses/:courseId/modules', authenticate, moduleController.addModule);

/**
 * PUT /api/v1/modules/:id
 * Update a module
 * Requires authentication (course owner only)
 * Note: courseId must be provided in request body
 */
router.put('/modules/:id', authenticate, moduleController.updateModule);

/**
 * DELETE /api/v1/modules/:id
 * Delete a module
 * Requires authentication (course owner only)
 * Note: courseId must be provided as query parameter
 */
router.delete('/modules/:id', authenticate, moduleController.deleteModule);

/**
 * POST /api/v1/modules/:moduleId/lessons
 * Add a lesson to a module
 * Requires authentication (course owner only)
 * Note: courseId must be provided in request body
 */
router.post('/modules/:moduleId/lessons', authenticate, moduleController.addLesson);

/**
 * PUT /api/v1/lessons/:id
 * Update a lesson
 * Requires authentication (course owner only)
 * Note: courseId and moduleId must be provided in request body
 */
router.put('/lessons/:id', authenticate, moduleController.updateLesson);

/**
 * DELETE /api/v1/lessons/:id
 * Delete a lesson
 * Requires authentication (course owner only)
 * Note: courseId and moduleId must be provided as query parameters
 */
router.delete('/lessons/:id', authenticate, moduleController.deleteLesson);

export default router;
