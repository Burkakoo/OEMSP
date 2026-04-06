import mongoose from 'mongoose';
import Course, { DiscountType } from '../models/Course';
import Coupon, { ICoupon } from '../models/Coupon';
import { applyCouponToPriceQuote, getCourseSalePriceQuote } from '../utils/pricing.utils';

export interface CreateCouponDTO {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumPurchaseAmount?: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}

export interface UpdateCouponDTO {
  code?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minimumPurchaseAmount?: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}

export interface CouponDTO {
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
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  isCurrentlyValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ensureValidObjectId = (value: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
};

const normalizeCouponCode = (code: string): string => code.trim().toUpperCase();

const sanitizeCouponPayload = <T extends CreateCouponDTO | UpdateCouponDTO>(payload: T): T => {
  const nextPayload = { ...payload };

  if (typeof nextPayload.code === 'string') {
    nextPayload.code = normalizeCouponCode(nextPayload.code);
  }

  if (typeof nextPayload.description === 'string') {
    nextPayload.description = nextPayload.description.trim();
    if (!nextPayload.description) {
      delete nextPayload.description;
    }
  }

  return nextPayload;
};

const isCouponCurrentlyValid = (coupon: ICoupon): boolean => {
  try {
    const courseStub = { _id: coupon.courseId } as any;
    const saleQuoteStub = {
      currency: 'ETB',
      basePrice: Number(coupon.minimumPurchaseAmount ?? 0),
      saleDiscountAmount: 0,
      currentPrice: Number(coupon.minimumPurchaseAmount ?? 0),
      couponDiscountAmount: 0,
      finalPrice: Number(coupon.minimumPurchaseAmount ?? 0),
      hasActiveSale: false,
    };

    applyCouponToPriceQuote(courseStub, saleQuoteStub, coupon);
    return true;
  } catch {
    return false;
  }
};

const mapCouponToDTO = (coupon: ICoupon): CouponDTO => ({
  id: coupon._id.toString(),
  courseId: coupon.courseId.toString(),
  code: coupon.code,
  description: coupon.description,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minimumPurchaseAmount: coupon.minimumPurchaseAmount,
  maxUses: coupon.maxUses,
  usedCount: coupon.usedCount,
  remainingUses:
    coupon.maxUses !== undefined ? Math.max(0, coupon.maxUses - coupon.usedCount) : undefined,
  validFrom: coupon.validFrom,
  validUntil: coupon.validUntil,
  isActive: coupon.isActive,
  isCurrentlyValid: isCouponCurrentlyValid(coupon),
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
});

const ensureCourseAccess = async (
  courseId: string,
  requesterId: string,
  canBypassOwnership = false
) => {
  ensureValidObjectId(courseId, 'course ID');
  ensureValidObjectId(requesterId, 'requester ID');

  const course = await Course.findById(courseId).select(
    '_id instructorId price currency isFree saleEnabled saleType saleValue saleStartsAt saleEndsAt'
  );

  if (!course) {
    throw new Error('Course not found');
  }

  if (!canBypassOwnership && course.instructorId.toString() !== requesterId) {
    throw new Error('Access denied');
  }

  return course;
};

export const listCourseCoupons = async (
  courseId: string,
  requesterId: string,
  canBypassOwnership = false
): Promise<CouponDTO[]> => {
  await ensureCourseAccess(courseId, requesterId, canBypassOwnership);

  const coupons = await Coupon.find({ courseId }).sort({ createdAt: -1 });
  return coupons.map(mapCouponToDTO);
};

export const createCoupon = async (
  courseId: string,
  couponData: CreateCouponDTO,
  requesterId: string,
  canBypassOwnership = false
): Promise<CouponDTO> => {
  const course = await ensureCourseAccess(courseId, requesterId, canBypassOwnership);
  const payload = sanitizeCouponPayload(couponData);

  if (!payload.code) {
    throw new Error('Coupon code is required');
  }

  const simulatedQuote = getCourseSalePriceQuote(course);
  const prospectiveCoupon = new Coupon({
    ...payload,
    courseId: course._id,
    createdBy: new mongoose.Types.ObjectId(requesterId),
  });

  applyCouponToPriceQuote({ _id: course._id } as any, simulatedQuote, prospectiveCoupon);

  const existingCoupon = await Coupon.findOne({
    courseId,
    code: prospectiveCoupon.code,
  }).select('_id');

  if (existingCoupon) {
    throw new Error('A coupon with this code already exists for the course');
  }

  await prospectiveCoupon.save();
  return mapCouponToDTO(prospectiveCoupon);
};

export const updateCoupon = async (
  couponId: string,
  updates: UpdateCouponDTO,
  requesterId: string,
  canBypassOwnership = false
): Promise<CouponDTO> => {
  ensureValidObjectId(couponId, 'coupon ID');
  ensureValidObjectId(requesterId, 'requester ID');

  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  const course = await ensureCourseAccess(coupon.courseId.toString(), requesterId, canBypassOwnership);
  const payload = sanitizeCouponPayload(updates);

  if (payload.code && payload.code !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      courseId: coupon.courseId,
      code: payload.code,
      _id: { $ne: coupon._id },
    }).select('_id');

    if (existingCoupon) {
      throw new Error('A coupon with this code already exists for the course');
    }
  }

  Object.assign(coupon, payload);

  const simulatedQuote = getCourseSalePriceQuote(course);
  applyCouponToPriceQuote({ _id: course._id } as any, simulatedQuote, coupon);

  await coupon.save();
  return mapCouponToDTO(coupon);
};

export const deleteCoupon = async (
  couponId: string,
  requesterId: string,
  canBypassOwnership = false
): Promise<void> => {
  ensureValidObjectId(couponId, 'coupon ID');
  ensureValidObjectId(requesterId, 'requester ID');

  const coupon = await Coupon.findById(couponId).select('_id courseId');
  if (!coupon) {
    throw new Error('Coupon not found');
  }

  await ensureCourseAccess(coupon.courseId.toString(), requesterId, canBypassOwnership);
  await Coupon.findByIdAndDelete(couponId);
};

export const getCouponByCode = async (
  courseId: string,
  couponCode: string
): Promise<ICoupon | null> => {
  ensureValidObjectId(courseId, 'course ID');
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) {
    return null;
  }

  return Coupon.findOne({
    courseId,
    code: normalizedCode,
  });
};

export const incrementCouponUsage = async (couponId: string): Promise<void> => {
  ensureValidObjectId(couponId, 'coupon ID');

  const updatedCoupon = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ maxUses: { $exists: false } }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!updatedCoupon) {
    throw new Error('Coupon usage limit has been reached');
  }
};
