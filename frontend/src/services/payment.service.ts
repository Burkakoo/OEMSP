/**
 * Payment API service
 */

import apiRequest from './api';
import { Payment, PaymentQuote, PaymentStatistics, ProcessPaymentData } from '../types/payment.types';

interface PaymentResponse {
  success: boolean;
  data: Payment;
}

interface PaymentsResponse {
  success: boolean;
  data: Payment[];
}

interface PaymentStatisticsResponse {
  success: boolean;
  data: PaymentStatistics;
}

interface PaymentQuoteResponse {
  success: boolean;
  data: PaymentQuote;
}

export const paymentService = {
  getPaymentQuote: async (pricingData: {
    courseId: string;
    couponCode?: string;
  }): Promise<PaymentQuoteResponse> => {
    return apiRequest<PaymentQuoteResponse>('/payments/quote', {
      method: 'POST',
      body: JSON.stringify(pricingData),
    });
  },

  processPayment: async (paymentData: ProcessPaymentData): Promise<PaymentResponse> => {
    return apiRequest<PaymentResponse>('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getPayment: async (id: string): Promise<PaymentResponse> => {
    return apiRequest<PaymentResponse>(`/payments/${id}`);
  },

  getPaymentHistory: async (): Promise<PaymentsResponse> => {
    return apiRequest<PaymentsResponse>('/payments');
  },

  refundPayment: async (id: string): Promise<PaymentResponse> => {
    return apiRequest<PaymentResponse>(`/payments/${id}/refund`, {
      method: 'POST',
    });
  },

  getPaymentStatistics: async (filters: Partial<{
    userId: string;
    courseId: string;
    status: string;
    paymentMethod: string;
    currency: string;
    startDate: string;
    endDate: string;
  }> = {}): Promise<PaymentStatisticsResponse> => {
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.status) params.append('status', filters.status);
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters.currency) params.append('currency', filters.currency);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    return apiRequest<PaymentStatisticsResponse>(`/payments/statistics${query ? `?${query}` : ''}`);
  },
};
