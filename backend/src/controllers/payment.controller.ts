import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as paymentService from '../services/payment.service';
import { createTriggeredNotification } from '../services/notification.service';
import {
  PaymentMethod,
  PaymentStatus,
  ETHIOPIAN_MOBILE_PAYMENT_METHODS,
  MOBILE_PAYMENT_METHODS,
} from '../models/Payment';
import { NotificationType } from '../models/Notification';
import Payment from '../models/Payment';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import Course from '../models/Course';
import { getCouponByCode, incrementCouponUsage } from '../services/coupon.service';

/**
 * Payment Controllers
 * Handle HTTP requests for payment operations
 */

/**
 * Get a pricing quote for a course checkout
 * POST /api/v1/payments/quote
 */
export const getPaymentQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, couponCode } = req.body;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    const quote = await paymentService.getPaymentQuote({
      courseId,
      couponCode,
    });

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    const statusCode =
      error.message.includes('not found') ? 404 :
      error.message.includes('Invalid') ? 400 :
      400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate pricing quote',
    });
  }
};

/**
 * Process payment
 * POST /api/v1/payments/process
 */
export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, amount, currency, paymentMethod, phoneNumber, couponCode } = req.body;

    // Validation
    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    if (amount === undefined || amount < 0) {
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

    if (!paymentMethod && amount > 0) {
      res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
      return;
    }

    // Validate payment method
    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
      return;
    }

    // Validate phone number for mobile-money payments
    if (paymentMethod && MOBILE_PAYMENT_METHODS.includes(paymentMethod)) {
      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: `Phone number is required for ${paymentMethod}`,
        });
        return;
      }

      const phoneRegex = ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(paymentMethod)
        ? /^\+251\d{9}$/
        : /^\+[1-9]\d{7,14}$/;

      if (!phoneRegex.test(phoneNumber)) {
        res.status(400).json({
          success: false,
          message: ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(paymentMethod)
            ? 'Invalid Ethiopian phone number format. Must be +251XXXXXXXXX'
            : 'Invalid phone number format. Use an international number like +254700000000',
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
      couponCode,
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
                       error.message.includes('already enrolled') ? 409 :
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
    const { reason } = req.body || {};

    // Only admins can refund payments
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admins can refund payments',
      });
      return;
    }

    const payment = await paymentService.refundPayment(
      id as string,
      req.user.userId,
      reason
    );

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

/**
 * M-PESA payment callback
 * POST /api/v1/payments/mpesa/callback
 */
export const mpesaCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const callbackData = req.body as any;

    // Log the callback for debugging
    console.log('M-PESA Callback received:', JSON.stringify(callbackData, null, 2));

    // Extract relevant data from callback
    const stkCallback = callbackData?.Body?.stkCallback;
    if (!stkCallback?.CheckoutRequestID) {
      res.status(400).json({ success: false, message: 'Invalid M-PESA callback payload' });
      return;
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find the payment by transaction ID
    const payment = await Payment.findOne({ transactionId: CheckoutRequestID });

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      res.status(200).json({ success: false, message: 'Payment not found' });
      return;
    }

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      const wasAlreadyCompleted = payment.status === PaymentStatus.COMPLETED;

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = payment.completedAt || new Date();
      payment.metadata.gatewayResponse = {
        ...payment.metadata.gatewayResponse,
        callback: callbackData,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
      };

      await payment.save();

      if (!wasAlreadyCompleted && payment.couponCode) {
        try {
          const coupon = await getCouponByCode(payment.courseId.toString(), payment.couponCode);
          if (coupon?._id) {
            await incrementCouponUsage(coupon._id.toString());
          }
        } catch (couponError) {
          console.error('Failed to increment coupon usage after M-PESA callback:', couponError);
        }
      }

      const existingEnrollment = await Enrollment.findOne({
        studentId: payment.userId,
        courseId: payment.courseId,
      }).select('_id');

      if (!existingEnrollment) {
        await Enrollment.create({
          studentId: payment.userId,
          courseId: payment.courseId,
          paymentId: payment._id,
        });
      }

      // Send success notification
      if (!wasAlreadyCompleted) {
        try {
        const user = await User.findById(payment.userId).select('firstName lastName');
        const course = await Course.findById(payment.courseId).select('title');

        await createTriggeredNotification({
          userId: payment.userId.toString(),
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment successful',
          message: `Your M-PESA payment for ${course?.title} was completed successfully.`,
          data: {
            courseTitle: course?.title,
            amount: payment.amount,
            currency: payment.currency,
            studentName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
            mpesaReceiptNumber,
          },
        });
        } catch (notificationError) {
          console.error('Failed to send M-PESA success notification:', notificationError);
        }
      }

      res.status(200).json({ success: true, message: 'Payment completed successfully' });
    } else {
      // Payment failed
      payment.status = PaymentStatus.FAILED;
      payment.metadata.gatewayResponse = {
        ...payment.metadata.gatewayResponse,
        callback: callbackData,
        error: ResultDesc,
      };

      await payment.save();

      // Send failure notification
      try {
        const course = await Course.findById(payment.courseId).select('title');

        await createTriggeredNotification({
          userId: payment.userId.toString(),
          type: NotificationType.PAYMENT_FAILED,
          title: 'Payment failed',
          message: `Your M-PESA payment for ${course?.title} could not be completed.`,
          data: {
            courseTitle: course?.title,
            amount: payment.amount,
            currency: payment.currency,
            reason: ResultDesc,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send M-PESA failure notification:', notificationError);
      }

      res.status(200).json({ success: false, message: ResultDesc });
    }
  } catch (error: any) {
    console.error('M-PESA callback processing error:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
};
