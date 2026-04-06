import apiRequest from './api';
import { Coupon, CreateCouponData, UpdateCouponData } from '@/types/coupon.types';

interface CouponResponse {
  success: boolean;
  coupon: Coupon;
}

interface CouponListResponse {
  success: boolean;
  coupons: Coupon[];
}

export const couponService = {
  getCourseCoupons: async (courseId: string): Promise<CouponListResponse> => {
    return apiRequest<CouponListResponse>(`/coupons/course/${courseId}`);
  },

  createCoupon: async (courseId: string, data: CreateCouponData): Promise<CouponResponse> => {
    return apiRequest<CouponResponse>(`/coupons/course/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCoupon: async (couponId: string, data: UpdateCouponData): Promise<CouponResponse> => {
    return apiRequest<CouponResponse>(`/coupons/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCoupon: async (couponId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/coupons/${couponId}`, {
      method: 'DELETE',
    });
  },
};
