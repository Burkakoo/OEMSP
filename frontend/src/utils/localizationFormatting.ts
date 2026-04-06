export const formatCurrencyValue = (
  amount: number,
  currency: string,
  locale: string
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
  } catch (_error) {
    return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
  }
};

export const formatDateValue = (
  value: Date | string | number,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options,
  }).format(new Date(value));
};

export const formatDateTimeValue = (
  value: Date | string | number,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  }
): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options,
  }).format(new Date(value));
};
