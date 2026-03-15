import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Question Routes
 * All routes require authentication
 */

/**
 * @route   PUT /api/v1/questions/:id
 * @desc    Update a quiz question by ID
 * @access  Private (Instructor only - course owner)
 */
router.put('/:id', authenticate, quizController.updateQuestion);

/**
 * @route   DELETE /api/v1/questions/:id
 * @desc    Delete a quiz question by ID
 * @access  Private (Instructor only - course owner)
 */
router.delete('/:id', authenticate, quizController.deleteQuestion);

export default router;

