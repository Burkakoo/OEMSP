import mongoose from 'mongoose';
import Payment, {
  IPayment,
  PaymentMethod,
  PaymentStatus,
  ETHIOPIAN_MOBILE_PAYMENT_METHODS,
} from '../models/Payment';
import Course from '../models/Course';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';

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

/**
 * Validate Ethiopian phone number for mobile payments
 */
const validateEthiopianPhone = (phoneNumber?: string, paymentMethod?: PaymentMethod): void => {
  if (paymentMethod && ETHIOPIAN_MOBILE_PAYMENT_METHODS.includes(paymentMethod)) {
    if (!phoneNumber) {
      throw new Error(`Phone number is required for ${paymentMethod}`);
    }

    const validation = Payment.validateEthiopianPhoneNumber(phoneNumber);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid phone number');
    }
  }
};

/**
 * Process Stripe payment (placeholder)
 * TODO: Implement actual Stripe integration
 */
const processStripePayment = async (
  amount: number,
  currency: string,
  metadata: any
): Promise<{ success: boolean; transactionId: string; error?: string }> => {
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
 * Process Telebirr payment (placeholder)
 * TODO: Implement actual Telebirr API integration
 */
const processTelebirrPayment = async (
  amount: number,
  phoneNumber: string,
  metadata: any
): Promise<{ success: boolean; transactionId: string; error?: string }> => {
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
): Promise<{ success: boolean; transactionId: string; error?: string }> => {
  // Placeholder implementation
  console.log('Processing CBE Birr payment:', { amount, phoneNumber, metadata });

  return {
    success: true,
    transactionId: generateTransactionId(),
  };
};

/**
 * Process bank payment (CBE, Awash, Siinqee) (placeholder)
 * TODO: Implement actual bank API integrations
 */
const processBankPayment = async (
  amount: number,
  bank: PaymentMethod,
  metadata: any
): Promise<{ success: boolean; transactionId: string; error?: string }> => {
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
): Promise<{ success: boolean; transactionId: string; error?: string }> => {
  switch (paymentMethod) {
    case PaymentMethod.STRIPE:
    case PaymentMethod.CREDIT_CARD:
    case PaymentMethod.DEBIT_CARD:
      return processStripePayment(amount, currency, metadata);

    case PaymentMethod.TELEBIRR:
      if (!phoneNumber) throw new Error('Phone number required for Telebirr');
      return processTelebirrPayment(amount, phoneNumber, metadata);

    case PaymentMethod.CBE_BIRR:
      if (!phoneNumber) throw new Error('Phone number required for CBE Birr');
      return processCBEBirrPayment(amount, phoneNumber, metadata);

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
  paymentMethod: PaymentMethod;
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

  // Validate course exists
  const course = await Course.findById(paymentData.courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  // Validate amount matches course price
  if (paymentData.amount !== course.price) {
    throw new Error('Payment amount does not match course price');
  }

  // Validate currency
  if (paymentData.currency !== 'USD' && paymentData.currency !== 'EUR' && paymentData.currency !== 'ETB') {
    throw new Error('Unsupported currency');
  }

  // Validate phone number for Ethiopian mobile payments
  validateEthiopianPhone(paymentData.phoneNumber, paymentData.paymentMethod);

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
    paymentData.amount,
    paymentData.currency,
    paymentData.paymentMethod,
    paymentData.phoneNumber,
    { userId: paymentData.userId, courseId: paymentData.courseId }
  );

  if (!paymentResult.success) {
    // Create failed payment record
    await Payment.create({
      userId: paymentData.userId,
      courseId: paymentData.courseId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      status: PaymentStatus.FAILED,
      transactionId: paymentResult.transactionId || generateTransactionId(),
      metadata: {
        ipAddress: paymentData.ipAddress,
        userAgent: paymentData.userAgent,
        phoneNumber: paymentData.phoneNumber,
        gatewayResponse: { error: paymentResult.error },
      },
    });

    throw new Error(paymentResult.error || 'Payment processing failed');
  }

  // Create successful payment record
  const payment = await Payment.create({
    userId: paymentData.userId,
    courseId: paymentData.courseId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paymentMethod: paymentData.paymentMethod,
    status: PaymentStatus.COMPLETED,
    transactionId: paymentResult.transactionId,
    completedAt: new Date(),
    metadata: {
      ipAddress: paymentData.ipAddress,
      userAgent: paymentData.userAgent,
      phoneNumber: paymentData.phoneNumber,
      gatewayResponse: paymentResult,
    },
  });

  // Invalidate caches
  await deleteCache(`payment:${payment._id}`);
  await deleteCache(`payments:user:${paymentData.userId}`);

  return payment;
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
    .populate('courseId', 'title price');

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
    .populate('courseId', 'title price');

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
      .populate('courseId', 'title price')
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
export const refundPayment = async (paymentId: string, adminId: string): Promise<IPayment> => {
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
  await payment.save();

  // Invalidate caches
  await deleteCache(`payment:${paymentId}`);
  await deleteCache(`payments:user:${payment.userId}`);

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
