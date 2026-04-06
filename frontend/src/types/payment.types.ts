/**
 * Payment type definitions
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  userId: string;
  courseId: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPaymentData {
  courseId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  couponCode?: string;
  phoneNumber?: string;
  stripeToken?: string;
}

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

export interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
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
    paymentMethod: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
  revenueByCurrency: Array<{
    currency: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
}
