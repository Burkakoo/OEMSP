import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Payment Routes
 * All routes require authentication
 */

/**
 * @route   POST /api/v1/payments/process
 * @desc    Process a payment for a course
 * @access  Private (Authenticated users)
 */
router.post('/process', authenticate, paymentController.processPayment);

/**
 * @route   GET /api/v1/payments/statistics
 * @desc    Get payment statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', authenticate, paymentController.getPaymentStatistics);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment by ID
 * @access  Private (Payment owner or Admin)
 */
router.get('/:id', authenticate, paymentController.getPayment);

/**
 * @route   GET /api/v1/payments
 * @desc    List payments
 * @access  Private (Users see own payments, Admins see all)
 */
router.get('/', authenticate, paymentController.listPayments);

/**
 * @route   POST /api/v1/payments/:id/refund
 * @desc    Refund a payment
 * @access  Private (Admin only)
 */
router.post('/:id/refund', authenticate, paymentController.refundPayment);

export default router;
