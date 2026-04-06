import { DiscountType } from './course.types';

export interface Coupon {
  id: string;
  courseId: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchaseAmount?: number;
  maxUses?: number;
  usedCount: number;
  remainingUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  isCurrentlyValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchaseAmount?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}
