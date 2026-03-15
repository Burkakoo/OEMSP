import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Quiz Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/v1/quizzes/:id
 * @desc    Get quiz by ID
 * @access  Private (Students see quiz without answers, Instructors see with answers)
 */
router.get('/:id', authenticate, quizController.getQuiz);

/**
 * @route   POST /api/v1/quizzes/:id/questions
 * @desc    Add a new question to a quiz
 * @access  Private (Instructor only - course owner)
 */
router.post('/:id/questions', authenticate, quizController.addQuestion);

/**
 * @route   POST /api/v1/courses/:courseId/quizzes
 * @desc    Create a new quiz
 * @access  Private (Instructor only - course owner)
 */
router.post('/courses/:courseId/quizzes', authenticate, quizController.createQuiz);

/**
 * @route   PUT /api/v1/quizzes/:id
 * @desc    Update quiz
 * @access  Private (Instructor only - course owner)
 */
router.put('/:id', authenticate, quizController.updateQuiz);

/**
 * @route   DELETE /api/v1/quizzes/:id
 * @desc    Delete quiz
 * @access  Private (Instructor only - course owner)
 */
router.delete('/:id', authenticate, quizController.deleteQuiz);

/**
 * @route   POST /api/v1/quizzes/:id/submit
 * @desc    Submit quiz answers
 * @access  Private (Student only)
 */
router.post('/:id/submit', authenticate, quizController.submitQuiz);

/**
 * @route   GET /api/v1/quizzes/:id/results
 * @desc    Get quiz results
 * @access  Private (Students see own results, Instructors see all results + statistics)
 */
router.get('/:id/results', authenticate, quizController.getQuizResults);

/**
 * @route   GET /api/v1/quizzes/:id/statistics
 * @desc    Get quiz statistics
 * @access  Private (Instructor/Admin only - instructor must own course)
 */
router.get('/:id/statistics', authenticate, quizController.getQuizStatistics);

export default router;
