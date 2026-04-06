import { Course } from '@/types/course.types';
import { formatCurrencyValue } from '@/utils/localizationFormatting';

export const formatMoney = (
  amount: number,
  currency: string,
  locale = 'en-US'
): string => formatCurrencyValue(amount, currency, locale);

export const getCourseDisplayPrice = (
  course: Pick<Course, 'isFree' | 'price' | 'currentPrice' | 'currency'>,
  options?: { locale?: string }
) => {
  const currentPrice = Number(course.currentPrice ?? course.price ?? 0);
  const originalPrice = Number(course.price ?? 0);
  const currency = course.currency || 'ETB';
  const locale = options?.locale || 'en-US';

  return {
    isFree: Boolean(course.isFree),
    originalPrice,
    currentPrice,
    originalPriceLabel: formatMoney(originalPrice, currency, locale),
    currentPriceLabel: formatMoney(currentPrice, currency, locale),
    hasDiscount: currentPrice < originalPrice,
  };
};
