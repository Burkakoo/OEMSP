import { ICourse, DiscountType } from '../models/Course';
import { ICoupon } from '../models/Coupon';

export interface AppliedCouponSummary {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
}

export interface PriceQuote {
  currency: string;
  basePrice: number;
  saleDiscountAmount: number;
  currentPrice: number;
  couponDiscountAmount: number;
  finalPrice: number;
  hasActiveSale: boolean;
  appliedCoupon?: AppliedCouponSummary;
}

export const roundCurrencyAmount = (value: number): number =>
  Math.round(value * 100) / 100;

const isWithinWindow = (
  startAt?: Date | string | null,
  endAt?: Date | string | null,
  now: Date = new Date()
): boolean => {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;

  if (start && start > now) {
    return false;
  }

  if (end && end < now) {
    return false;
  }

  return true;
};

const calculateDiscountAmount = (
  amount: number,
  discountType: DiscountType,
  discountValue: number
): number => {
  if (amount <= 0 || discountValue <= 0) {
    return 0;
  }

  if (discountType === DiscountType.PERCENTAGE) {
    return roundCurrencyAmount((amount * discountValue) / 100);
  }

  return roundCurrencyAmount(discountValue);
};

export const getCourseSalePriceQuote = (
  course: Pick<
    ICourse,
    'price' | 'currency' | 'isFree' | 'saleEnabled' | 'saleType' | 'saleValue' | 'saleStartsAt' | 'saleEndsAt'
  >,
  now: Date = new Date()
): PriceQuote => {
  const basePrice = roundCurrencyAmount(course.isFree ? 0 : Number(course.price ?? 0));

  if (
    basePrice <= 0 ||
    !course.saleEnabled ||
    !course.saleType ||
    !course.saleValue ||
    !isWithinWindow(course.saleStartsAt, course.saleEndsAt, now)
  ) {
    return {
      currency: course.currency,
      basePrice,
      saleDiscountAmount: 0,
      currentPrice: basePrice,
      couponDiscountAmount: 0,
      finalPrice: basePrice,
      hasActiveSale: false,
    };
  }

  const rawSaleDiscount = calculateDiscountAmount(basePrice, course.saleType, course.saleValue);
  const saleDiscountAmount = Math.min(basePrice, rawSaleDiscount);
  const currentPrice = roundCurrencyAmount(Math.max(0, basePrice - saleDiscountAmount));

  return {
    currency: course.currency,
    basePrice,
    saleDiscountAmount,
    currentPrice,
    couponDiscountAmount: 0,
    finalPrice: currentPrice,
    hasActiveSale: saleDiscountAmount > 0,
  };
};

export const validateCouponForCourse = (
  course: Pick<ICourse, '_id'>,
  coupon: Pick<
    ICoupon,
    '_id' | 'courseId' | 'code' | 'discountType' | 'discountValue' | 'minimumPurchaseAmount' | 'maxUses' | 'usedCount' | 'validFrom' | 'validUntil' | 'isActive'
  >,
  amountBeforeCoupon: number,
  now: Date = new Date()
): void => {
  if (String(coupon.courseId) !== String(course._id)) {
    throw new Error('Coupon is not valid for this course');
  }

  if (!coupon.isActive) {
    throw new Error('Coupon is inactive');
  }

  if (!isWithinWindow(coupon.validFrom, coupon.validUntil, now)) {
    throw new Error('Coupon is outside its valid date range');
  }

  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Coupon usage limit has been reached');
  }

  if (
    coupon.minimumPurchaseAmount !== undefined &&
    roundCurrencyAmount(amountBeforeCoupon) < roundCurrencyAmount(coupon.minimumPurchaseAmount)
  ) {
    throw new Error('Coupon minimum purchase amount has not been reached');
  }
};

export const applyCouponToPriceQuote = (
  course: Pick<ICourse, '_id'>,
  baseQuote: PriceQuote,
  coupon?: Pick<
    ICoupon,
    '_id' | 'courseId' | 'code' | 'discountType' | 'discountValue' | 'minimumPurchaseAmount' | 'maxUses' | 'usedCount' | 'validFrom' | 'validUntil' | 'isActive'
  >,
  now: Date = new Date()
): PriceQuote => {
  if (!coupon) {
    return baseQuote;
  }

  validateCouponForCourse(course, coupon, baseQuote.currentPrice, now);

  const rawCouponDiscount = calculateDiscountAmount(
    baseQuote.currentPrice,
    coupon.discountType,
    coupon.discountValue
  );
  const couponDiscountAmount = Math.min(baseQuote.currentPrice, rawCouponDiscount);
  const finalPrice = roundCurrencyAmount(Math.max(0, baseQuote.currentPrice - couponDiscountAmount));

  return {
    ...baseQuote,
    couponDiscountAmount,
    finalPrice,
    appliedCoupon: {
      id: String(coupon._id),
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  };
};
