import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as paymentService from '../services/payment.service';
import { PaymentMethod, PaymentStatus, ETHIOPIAN_MOBILE_PAYMENT_METHODS } from '../models/Payment';

/**
 * Payment Controllers
 * Handle HTTP requests for payment operations
 */

/**
 * Process payment
 * POST /api/v1/payments/process
 */
export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, amount, currency, paymentMethod, phoneNumber } = req.body;

    // Validation
    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
      return;
    }

    if (!currency) {
      res.status(400).json({
        success: false,
        message: 'Currency is required',
      });
      return;
    }

    if (!paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
      return;
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
      return;
    }

    // Validate phone number for Ethiopian mobile payments
    if (ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(paymentMethod)) {
      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: `Phone number is required for ${paymentMethod}`,
        });
        return;
      }

      // Validate Ethiopian phone number format
      const phoneRegex = /^\+251\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Ethiopian phone number format. Must be +251XXXXXXXXX',
        });
        return;
      }
    }

    // Get user ID from authenticated user
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get IP address and user agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      req.socket.remoteAddress || 
                      '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const payment = await paymentService.processPayment({
      userId,
      courseId,
      amount,
      currency: currency.toUpperCase(),
      paymentMethod,
      phoneNumber,
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('already completed') ? 409 :
                       error.message.includes('does not match') ? 400 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Payment processing failed',
    });
  }
};

/**
 * Get payment by ID
 * GET /api/v1/payments/:id
 */
export const getPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPayment(id as string);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    // Access control: users can only see their own payments, admins see all
    if (req.user?.role !== 'admin' && payment.userId.toString() !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get payment',
    });
  }
};

/**
 * List payments
 * GET /api/v1/payments
 */
export const listPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, courseId, status, page, limit } = req.query;

    // Access control: users can only see their own payments, admins see all
    const filters: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    if (req.user?.role === 'admin') {
      // Admins can filter by any criteria
      if (userId) filters.userId = userId as string;
      if (courseId) filters.courseId = courseId as string;
      if (status) filters.status = status as PaymentStatus;
    } else {
      // Regular users can only see their own payments
      filters.userId = req.user?.userId;
    }

    const result = await paymentService.listPayments(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to list payments',
    });
  }
};

/**
 * Get payment statistics (admin only)
 * GET /api/v1/payments/statistics
 */
export const getPaymentStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only admins can access payment statistics
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
      return;
    }

    const { userId, courseId, status, paymentMethod, currency, startDate, endDate } = req.query;

    // Basic enum validation early for nicer errors
    if (status && !Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
      return;
    }

    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
      return;
    }

    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    if (parsedStartDate && Number.isNaN(parsedStartDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid startDate',
      });
      return;
    }

    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid endDate',
      });
      return;
    }

    const statistics = await paymentService.getPaymentStatistics({
      userId: userId as string | undefined,
      courseId: courseId as string | undefined,
      status: status as PaymentStatus | undefined,
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      currency: currency ? String(currency).toUpperCase() : undefined,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('Invalid') ? 400 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to get payment statistics',
    });
  }
};

/**
 * Refund payment
 * POST /api/v1/payments/:id/refund
 */
export const refundPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admins can refund payments
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admins can refund payments',
      });
      return;
    }

    const payment = await paymentService.refundPayment(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment refunded successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Only completed') ? 400 :
                       error.message.includes('already refunded') ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to refund payment',
    });
  }
};
