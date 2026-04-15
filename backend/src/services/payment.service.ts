import mongoose from 'mongoose';
import axios from 'axios';
import Payment, {
  MOBILE_PAYMENT_METHODS,
  PurchaseType,
  IPayment,
  PaymentMethod,
  PaymentStatus,
  ETHIOPIAN_MOBILE_PAYMENT_METHODS,
} from '../models/Payment';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { NotificationType } from '../models/Notification';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';
import { getCouponByCode, incrementCouponUsage } from './coupon.service';
import { applyCouponToPriceQuote, getCourseSalePriceQuote, roundCurrencyAmount } from '../utils/pricing.utils';
import { createTriggeredNotification } from './notification.service';
import { env } from '../config/env.config';

const CACHE_TTL = 300; // 5 minutes

/**
 * Payment Service
 * Handles payment processing, verification, and refunds
 * 
 * NOTE: This implementation includes placeholder integrations for payment gateways.
 * In production, you would need to:
 * 1. Install Stripe SDK: npm install stripe
 * 2. Obtain API credentials for each payment gateway
 * 3. Implement actual API calls to payment providers
 * 4. Handle webhooks for payment confirmations
 * 5. Implement proper error handling and retry logic
 */

/**
 * Generate unique transaction ID
 */
const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
};

export interface PaymentQuote {
  courseId: string;
  courseTitle: string;
  currency: string;
  basePrice: number;
  saleDiscountAmount: number;
  currentPrice: number;
  couponDiscountAmount: number;
  finalPrice: number;
  hasActiveSale: boolean;
  appliedCoupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  };
}

interface PaymentGatewayResult {
  success: boolean;
  transactionId: string;
  status?: PaymentStatus;
  error?: string;
  message?: string;
  gatewayResponse?: Record<string, unknown>;
}

const resolvePaymentQuote = async (
  courseId: string,
  couponCode?: string
): Promise<{
  course: any;
  quote: PaymentQuote;
}> => {
  const course = await Course.findById(courseId).select(
    'title price currency isFree isPublished saleEnabled saleType saleValue saleStartsAt saleEndsAt'
  );

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.isPublished) {
    throw new Error('Cannot purchase an unpublished course');
  }

  const saleQuote = getCourseSalePriceQuote(course);
  const coupon = couponCode ? await getCouponByCode(courseId, couponCode) : null;
  const finalQuote = coupon
    ? applyCouponToPriceQuote({ _id: course._id } as any, saleQuote, coupon)
    : saleQuote;

  return {
    course,
    quote: {
      courseId: course._id.toString(),
      courseTitle: course.title,
      currency: course.currency,
      basePrice: finalQuote.basePrice,
      saleDiscountAmount: finalQuote.saleDiscountAmount,
      currentPrice: finalQuote.currentPrice,
      couponDiscountAmount: finalQuote.couponDiscountAmount,
      finalPrice: finalQuote.finalPrice,
      hasActiveSale: finalQuote.hasActiveSale,
      appliedCoupon: finalQuote.appliedCoupon,
    },
  };
};

/**
 * Validate phone number for mobile-money payments
 */
const validateMobileMoneyPhone = (phoneNumber?: string, paymentMethod?: PaymentMethod): void => {
  if (!paymentMethod || !MOBILE_PAYMENT_METHODS.includes(paymentMethod)) {
    return;
  }

  if (!phoneNumber) {
    throw new Error(`Phone number is required for ${paymentMethod}`);
  }

  if (ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(paymentMethod)) {
    const validation = Payment.validateEthiopianPhoneNumber(phoneNumber);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid phone number');
    }
    return;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new Error(
      'Invalid phone number format. Use an international number like +254700000000'
    );
  }
};

const getMpesaBaseUrl = (): string =>
  env.MPESA_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox.safaricom.co.et'
    : 'https://api.safaricom.co.et';

const getMpesaCredentialPair = (): { consumerKey: string; consumerSecret: string } => {
  const consumerKey = (
    env.MPESA_CONSUMER_KEY ||
    env.MPESA_API_KEY ||
    process.env.MPESA_CONSUMER_KEY ||
    process.env.MPESA_API_KEY ||
    ''
  ).trim();
  const consumerSecret = (
    env.MPESA_CONSUMER_SECRET ||
    env.MPESA_PUBLIC_KEY ||
    process.env.MPESA_CONSUMER_SECRET ||
    process.env.MPESA_PUBLIC_KEY ||
    ''
  ).trim();

  const configErrors: string[] = [];

  if (!consumerKey || /^https?:\/\//i.test(consumerKey)) {
    configErrors.push('set MPESA_CONSUMER_KEY (or MPESA_API_KEY) to your OAuth consumer key');
  }

  if (!consumerSecret || /^https?:\/\//i.test(consumerSecret)) {
    configErrors.push('set MPESA_CONSUMER_SECRET (or MPESA_PUBLIC_KEY) to your OAuth consumer secret');
  }

  if (!env.MPESA_SHORTCODE?.trim()) {
    configErrors.push('set MPESA_SHORTCODE');
  }

  if (!env.MPESA_PASSKEY?.trim()) {
    configErrors.push('set MPESA_PASSKEY');
  }

  if (configErrors.length > 0) {
    throw new Error(`M-PESA configuration error: ${configErrors.join('; ')}`);
  }

  return { consumerKey, consumerSecret };
};

const buildMpesaCallbackUrl = (): string => {
  const baseUrl = (env.PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || process.env.BASE_URL || '').trim();

  if (!baseUrl) {
    throw new Error(
      'M-PESA configuration error: set PUBLIC_BASE_URL to a public HTTPS URL that can receive callbacks'
    );
  }

  if (/localhost|127\.0\.0\.1/i.test(baseUrl)) {
    throw new Error(
      'M-PESA configuration error: PUBLIC_BASE_URL cannot point to localhost because Safaricom cannot reach it'
    );
  }

  return `${baseUrl.replace(/\/+$/, '')}/api/v1/payments/mpesa/callback`;
};

/**
 * Process Stripe payment (placeholder)
 * TODO: Implement actual Stripe integration
 */
const processStripePayment = async (
  amount: number,
  currency: string,
  metadata: any
): Promise<PaymentGatewayResult> => {
  // Placeholder implementation
  // In production, use Stripe SDK:
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({ amount, currency, ... });

  console.log('Processing Stripe payment:', { amount, currency, metadata });

  // Simulate payment processing
  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process PayPal payment (placeholder)
 */
const processPayPalPayment = async (
  amount: number,
  currency: string,
  metadata: any
): Promise<PaymentGatewayResult> => {
  console.log('Processing PayPal payment:', { amount, currency, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process Telebirr payment (placeholder)
 * TODO: Implement actual Telebirr API integration
 */
const processTelebirrPayment = async (
  amount: number,
  phoneNumber: string,
  metadata: any
): Promise<PaymentGatewayResult> => {
  // Placeholder implementation
  // In production, integrate with Telebirr API

  console.log('Processing Telebirr payment:', { amount, phoneNumber, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process CBE Birr payment (placeholder)
 * TODO: Implement actual CBE Birr API integration
 */
const processCBEBirrPayment = async (
  amount: number,
  phoneNumber: string,
  metadata: any
): Promise<PaymentGatewayResult> => {
  // Placeholder implementation
  console.log('Processing CBE Birr payment:', { amount, phoneNumber, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process generic mobile-money payment (placeholder)
 */
const processGenericMobileMoneyPayment = async (
  amount: number,
  phoneNumber: string,
  provider: PaymentMethod,
  metadata: any
): Promise<PaymentGatewayResult> => {
  console.log(`Processing ${provider} payment:`, { amount, phoneNumber, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process M-PESA Ethiopia payment
 * TODO: Implement actual M-PESA API integration
 */
const processMpesaPayment = async (
  amount: number,
  phoneNumber: string,
  metadata: any
): Promise<PaymentGatewayResult> => {
  try {
    const baseUrl = getMpesaBaseUrl();
    const { consumerKey, consumerSecret } = getMpesaCredentialPair();
    const callbackUrl = buildMpesaCallbackUrl();

    // Step 1: Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkPushData = {
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber.replace('+', ''), // Remove + from phone number
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber.replace('+', ''),
      CallBackURL: callbackUrl,
      AccountReference: `Course-${metadata.courseId}`,
      TransactionDesc: `Payment for ${metadata.courseTitle || 'course purchase'}`,
    };

    const stkResponse = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, stkPushData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (stkResponse.data.ResponseCode === '0') {
      return {
        success: true,
        transactionId: stkResponse.data.CheckoutRequestID,
        status: PaymentStatus.PENDING,
        message: stkResponse.data.CustomerMessage || 'M-PESA prompt sent to your phone',
        gatewayResponse: {
          MerchantRequestID: stkResponse.data.MerchantRequestID,
          CheckoutRequestID: stkResponse.data.CheckoutRequestID,
          ResponseCode: stkResponse.data.ResponseCode,
          ResponseDescription: stkResponse.data.ResponseDescription,
          CustomerMessage: stkResponse.data.CustomerMessage,
        },
      };
    } else {
      return {
        success: false,
        transactionId: generateTransactionId(),
        error: stkResponse.data.CustomerMessage || 'M-PESA payment failed',
      };
    }
  } catch (error: any) {
    console.error('M-PESA payment error:', error.response?.data || error.message);
    return {
      success: false,
      transactionId: generateTransactionId(),
      error:
        error.response?.data?.errorMessage ||
        error.response?.data?.error_description ||
        error.message ||
        'M-PESA service unavailable',
    };
  }
};

/**
 * Process bank payment (CBE, Awash, Siinqee) (placeholder)
 * TODO: Implement actual bank API integrations
 */
const processBankPayment = async (
  amount: number,
  bank: PaymentMethod,
  metadata: any
): Promise<PaymentGatewayResult> => {
  // Placeholder implementation
  console.log(`Processing ${bank} payment:`, { amount, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Route payment to appropriate gateway
 */
const routePayment = async (
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  phoneNumber?: string,
  metadata?: any
): Promise<PaymentGatewayResult> => {
  switch (paymentMethod) {
    case PaymentMethod.COUPON:
      return {
        success: true,
        transactionId: generateTransactionId(),
      };

    case PaymentMethod.STRIPE:
    case PaymentMethod.CREDIT_CARD:
    case PaymentMethod.DEBIT_CARD:
      return processStripePayment(amount, currency, metadata);

    case PaymentMethod.PAYPAL:
      return processPayPalPayment(amount, currency, metadata);

    case PaymentMethod.TELEBIRR:
      if (!phoneNumber) throw new Error('Phone number required for Telebirr');
      return processTelebirrPayment(amount, phoneNumber, metadata);

    case PaymentMethod.CBE_BIRR:
      if (!phoneNumber) throw new Error('Phone number required for CBE Birr');
      return processCBEBirrPayment(amount, phoneNumber, metadata);

    case PaymentMethod.MPESA:
      if (!phoneNumber) throw new Error('Phone number required for M-PESA');
      return processMpesaPayment(amount, phoneNumber, metadata);

    case PaymentMethod.MOBILE_MONEY:
    case PaymentMethod.MTN_MOMO:
    case PaymentMethod.AIRTEL_MONEY:
    case PaymentMethod.ORANGE_MONEY:
      if (!phoneNumber) throw new Error(`Phone number required for ${paymentMethod}`);
      return processGenericMobileMoneyPayment(
        amount,
        phoneNumber,
        paymentMethod,
        metadata
      );

    case PaymentMethod.CBE:
    case PaymentMethod.AWASH_BANK:
    case PaymentMethod.SIINQEE_BANK:
      return processBankPayment(amount, paymentMethod, metadata);

    default:
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }
};

/**
 * Process payment
 */
export const processPayment = async (paymentData: {
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  couponCode?: string;
  phoneNumber?: string;
  ipAddress: string;
  userAgent: string;
}): Promise<IPayment> => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(paymentData.userId)) {
    throw new Error('Invalid user ID');
  }
  if (!mongoose.Types.ObjectId.isValid(paymentData.courseId)) {
    throw new Error('Invalid course ID');
  }

  const existingEnrollment = await Enrollment.findOne({
    studentId: paymentData.userId,
    courseId: paymentData.courseId,
  }).select('_id');

  if (existingEnrollment) {
    throw new Error('User is already enrolled in this course');
  }

  const { course, quote } = await resolvePaymentQuote(paymentData.courseId, paymentData.couponCode);
  const normalizedAmount = roundCurrencyAmount(paymentData.amount);
  const expectedAmount = roundCurrencyAmount(quote.finalPrice);

  if (normalizedAmount !== expectedAmount) {
    throw new Error('Payment amount does not match the quoted course price');
  }

  const normalizedCurrency = String(paymentData.currency).toUpperCase();
  if (normalizedCurrency !== course.currency) {
    throw new Error('Payment currency does not match course currency');
  }

  const normalizedPaymentMethod =
    expectedAmount === 0 ? PaymentMethod.COUPON : paymentData.paymentMethod;
  if (!normalizedPaymentMethod) {
    throw new Error('Payment method is required');
  }

  // Validate phone number for mobile-money payments
  validateMobileMoneyPhone(paymentData.phoneNumber, normalizedPaymentMethod);

  // Check for duplicate payment
  const existingPayment = await Payment.findOne({
    userId: paymentData.userId,
    courseId: paymentData.courseId,
    status: PaymentStatus.COMPLETED,
  });

  if (existingPayment) {
    throw new Error('Payment already completed for this course');
  }

  // Process payment through gateway
  const paymentResult = await routePayment(
    expectedAmount,
    normalizedCurrency,
    normalizedPaymentMethod,
      paymentData.phoneNumber,
      {
        userId: paymentData.userId,
        courseId: paymentData.courseId,
        courseTitle: quote.courseTitle,
        couponCode: quote.appliedCoupon?.code,
        originalAmount: quote.basePrice,
        discountAmount: quote.saleDiscountAmount + quote.couponDiscountAmount,
      }
    );

  if (!paymentResult.success) {
    // Create failed payment record
    await Payment.create({
      userId: paymentData.userId,
      courseId: paymentData.courseId,
      amount: expectedAmount,
      originalAmount: quote.basePrice,
      discountAmount: roundCurrencyAmount(
        quote.saleDiscountAmount + quote.couponDiscountAmount
      ),
      couponCode: quote.appliedCoupon?.code,
      currency: normalizedCurrency,
      purchaseType: PurchaseType.COURSE,
      paymentMethod: normalizedPaymentMethod,
      status: PaymentStatus.FAILED,
      transactionId: paymentResult.transactionId || generateTransactionId(),
      metadata: {
        ipAddress: paymentData.ipAddress,
        userAgent: paymentData.userAgent,
        phoneNumber: paymentData.phoneNumber,
        gatewayResponse: { error: paymentResult.error },
      },
    });

    try {
      await createTriggeredNotification({
        userId: paymentData.userId,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment failed',
        message: `Your payment for ${quote.courseTitle} could not be completed.`,
        data: {
          courseTitle: quote.courseTitle,
          amount: expectedAmount,
          currency: normalizedCurrency,
          reason: paymentResult.error || 'Payment processing failed',
        },
      });
    } catch (notificationError) {
      console.error('Failed to send payment failure notification:', notificationError);
    }

    throw new Error(paymentResult.error || 'Payment processing failed');
  }

  // Create successful payment record
  const paymentStatus = paymentResult.status || PaymentStatus.COMPLETED;
  const payment = await Payment.create({
    userId: paymentData.userId,
    courseId: paymentData.courseId,
    amount: expectedAmount,
    originalAmount: quote.basePrice,
    discountAmount: roundCurrencyAmount(
      quote.saleDiscountAmount + quote.couponDiscountAmount
    ),
    couponCode: quote.appliedCoupon?.code,
    currency: normalizedCurrency,
    purchaseType: PurchaseType.COURSE,
    paymentMethod: normalizedPaymentMethod,
    status: paymentStatus,
    transactionId: paymentResult.transactionId,
    completedAt: paymentStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
    metadata: {
      ipAddress: paymentData.ipAddress,
      userAgent: paymentData.userAgent,
      phoneNumber: paymentData.phoneNumber,
      gatewayResponse: paymentResult.gatewayResponse || paymentResult,
    },
  });

  // Invalidate caches
  await deleteCache(`payment:${payment._id}`);
  await deleteCache(`payments:user:${paymentData.userId}`);

  if (paymentStatus === PaymentStatus.COMPLETED && quote.appliedCoupon?.id) {
    await incrementCouponUsage(quote.appliedCoupon.id);
  }

  if (paymentStatus === PaymentStatus.COMPLETED) {
    try {
      const user = await User.findById(paymentData.userId).select('firstName lastName');
      await createTriggeredNotification({
        userId: paymentData.userId,
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment successful',
        message: `Your payment for ${quote.courseTitle} was completed successfully.`,
        data: {
          courseTitle: quote.courseTitle,
          amount: expectedAmount,
          currency: normalizedCurrency,
          studentName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send payment success notification:', notificationError);
    }
  }

  return payment;
};

export const getPaymentQuote = async (input: {
  courseId: string;
  couponCode?: string;
}): Promise<PaymentQuote> => {
  if (!mongoose.Types.ObjectId.isValid(input.courseId)) {
    throw new Error('Invalid course ID');
  }

  const { quote } = await resolvePaymentQuote(input.courseId, input.couponCode);
  return quote;
};

/**
 * Verify payment status
 */
export const verifyPayment = async (transactionId: string): Promise<IPayment | null> => {
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  const payment = await Payment.findOne({ transactionId })
    .populate('userId', 'firstName lastName email')
    .populate('courseId', 'title price currency');

  return payment;
};

/**
 * Get payment by ID
 */
export const getPayment = async (paymentId: string): Promise<IPayment | null> => {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment ID');
  }

  // Try cache first
  const cacheKey = `payment:${paymentId}`;
  const cached = await getCache<IPayment>(cacheKey);
  if (cached) {
    return cached;
  }

  const payment = await Payment.findById(paymentId)
    .populate('userId', 'firstName lastName email')
    .populate('courseId', 'title price currency');

  if (payment) {
    await setCache(cacheKey, payment, CACHE_TTL);
  }

  return payment;
};

/**
 * List payments with filters
 */
export const listPayments = async (filters: {
  userId?: string;
  courseId?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}): Promise<{ payments: IPayment[]; total: number; page: number; pages: number }> => {
  const { userId, courseId, status, page = 1, limit = 10 } = filters;

  // Build query
  const query: any = {};
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    query.userId = userId;
  }
  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID');
    }
    query.courseId = courseId;
  }
  if (status) {
    query.status = status;
  }

  // Try cache for user-specific queries
  if (userId && !courseId && !status) {
    const cacheKey = `payments:user:${userId}:${page}:${limit}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Execute query
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'title price currency')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Payment.countDocuments(query),
  ]);

  const result = {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };

  // Cache user-specific queries
  if (userId && !courseId && !status) {
    const cacheKey = `payments:user:${userId}:${page}:${limit}`;
    await setCache(cacheKey, result, CACHE_TTL);
  }

  return result;
};

/**
 * Refund payment (admin only)
 */
export const refundPayment = async (
  paymentId: string,
  adminId: string,
  reason?: string
): Promise<IPayment> => {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment ID');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error('Only completed payments can be refunded');
  }



  // TODO: Implement actual refund through payment gateway
  // For Stripe: await stripe.refunds.create({ payment_intent: payment.transactionId });
  // For Ethiopian gateways: implement respective refund APIs

  console.log(`Refunding payment ${paymentId} by admin ${adminId}`);

  // Update payment status
  payment.status = PaymentStatus.REFUNDED;
  payment.refundedAt = new Date();
  payment.refundReason = reason;
  payment.refundedBy = new mongoose.Types.ObjectId(adminId);
  await payment.save();

  // Invalidate caches
  await deleteCache(`payment:${paymentId}`);
  await deleteCache(`payments:user:${payment.userId}`);

  try {
    const course = await Course.findById(payment.courseId).select('title');
    await createTriggeredNotification({
      userId: payment.userId.toString(),
      type: NotificationType.PAYMENT_REFUNDED,
      title: 'Refund processed',
      message: `A refund has been processed for ${course?.title || 'your purchase'}.`,
      data: {
        courseTitle: course?.title,
        amount: payment.amount,
        currency: payment.currency,
        reason,
      },
    });
  } catch (notificationError) {
    console.error('Failed to send refund notification:', notificationError);
  }

  return payment;
};

export interface PaymentStatisticsFilters {
  userId?: string;
  courseId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  revenueStatus: PaymentStatus;
  transactionCount: number;
  totalRevenue: number;
  averageTransactionValue: number;
  paymentsByStatus: Record<PaymentStatus, number>;
  amountByStatus: Record<PaymentStatus, number>;
  revenueByMethod: Array<{
    paymentMethod: PaymentMethod;
    transactionCount: number;
    totalRevenue: number;
  }>;
  revenueByCurrency: Array<{
    currency: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
}

/**
 * Get payment statistics (admin dashboard)
 */
export const getPaymentStatistics = async (filters: PaymentStatisticsFilters = {}): Promise<PaymentStatistics> => {
  const match: any = {};

  if (filters.userId) {
    if (!mongoose.Types.ObjectId.isValid(filters.userId)) {
      throw new Error('Invalid user ID');
    }
    match.userId = new mongoose.Types.ObjectId(filters.userId);
  }

  if (filters.courseId) {
    if (!mongoose.Types.ObjectId.isValid(filters.courseId)) {
      throw new Error('Invalid course ID');
    }
    match.courseId = new mongoose.Types.ObjectId(filters.courseId);
  }

  if (filters.status) {
    if (!Object.values(PaymentStatus).includes(filters.status)) {
      throw new Error('Invalid payment status');
    }
    match.status = filters.status;
  }

  if (filters.paymentMethod) {
    if (!Object.values(PaymentMethod).includes(filters.paymentMethod)) {
      throw new Error('Invalid payment method');
    }
    match.paymentMethod = filters.paymentMethod;
  }

  if (filters.currency) {
    const normalizedCurrency = String(filters.currency).toUpperCase();
    match.currency = normalizedCurrency;
  }

  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = filters.startDate;
    if (filters.endDate) match.createdAt.$lte = filters.endDate;
  }

  const revenueStatus: PaymentStatus = filters.status ?? PaymentStatus.COMPLETED;

  const [stats] = await Payment.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalPayments: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              amount: { $sum: '$amount' },
            },
          },
        ],
        revenue: [
          { $match: { status: revenueStatus } },
          {
            $group: {
              _id: null,
              transactionCount: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
              averageTransactionValue: { $avg: '$amount' },
            },
          },
        ],
        byMethod: [
          { $match: { status: revenueStatus } },
          {
            $group: {
              _id: '$paymentMethod',
              transactionCount: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
            },
          },
          { $sort: { totalRevenue: -1 } },
        ],
        byCurrency: [
          { $match: { status: revenueStatus } },
          {
            $group: {
              _id: '$currency',
              transactionCount: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
            },
          },
          { $sort: { totalRevenue: -1 } },
        ],
      },
    },
  ]);

  const totals = (stats?.totals && stats.totals[0]) || { totalPayments: 0, totalAmount: 0 };
  const revenue = (stats?.revenue && stats.revenue[0]) || {
    transactionCount: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
  };

  const paymentsByStatus: Record<PaymentStatus, number> = {
    pending: 0,
    completed: 0,
    failed: 0,
    refunded: 0,
  };

  const amountByStatus: Record<PaymentStatus, number> = {
    pending: 0,
    completed: 0,
    failed: 0,
    refunded: 0,
  };

  const byStatusRows: Array<{ _id: PaymentStatus; count: number; amount: number }> = stats?.byStatus || [];
  for (const row of byStatusRows) {
    if (!row || !row._id) continue;
    paymentsByStatus[row._id] = row.count || 0;
    amountByStatus[row._id] = row.amount || 0;
  }

  const revenueByMethod = (stats?.byMethod || []).map((row: any) => ({
    paymentMethod: row._id as PaymentMethod,
    transactionCount: row.transactionCount || 0,
    totalRevenue: row.totalRevenue || 0,
  }));

  const revenueByCurrency = (stats?.byCurrency || []).map((row: any) => ({
    currency: row._id as string,
    transactionCount: row.transactionCount || 0,
    totalRevenue: row.totalRevenue || 0,
  }));

  return {
    totalPayments: totals.totalPayments || 0,
    totalAmount: Math.round((totals.totalAmount || 0) * 100) / 100,
    revenueStatus,
    transactionCount: revenue.transactionCount || 0,
    totalRevenue: Math.round((revenue.totalRevenue || 0) * 100) / 100,
    averageTransactionValue: Math.round((revenue.averageTransactionValue || 0) * 100) / 100,
    paymentsByStatus,
    amountByStatus: {
      pending: Math.round((amountByStatus.pending || 0) * 100) / 100,
      completed: Math.round((amountByStatus.completed || 0) * 100) / 100,
      failed: Math.round((amountByStatus.failed || 0) * 100) / 100,
      refunded: Math.round((amountByStatus.refunded || 0) * 100) / 100,
    },
    revenueByMethod,
    revenueByCurrency,
  };
};
