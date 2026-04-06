import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  formatCurrencyValue,
  formatDateTimeValue,
  formatDateValue,
} from '@/utils/localizationFormatting';
import {
  messages,
  SupportedLanguage,
  TranslationKey,
} from '@/localization/messages';

export type SupportedCurrency = 'ETB' | 'USD' | 'EUR';

export interface LocalizationPreferences {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  timezone: string;
}

export const LANGUAGE_OPTIONS: Array<{
  value: SupportedLanguage;
  label: string;
  locale: string;
}> = [
  { value: 'en', label: 'English', locale: 'en-US' },
  { value: 'om', label: 'Afaan Oromo', locale: 'om-ET' },
  { value: 'am', label: 'አማርኛ', locale: 'am-ET' },
];

export const CURRENCY_OPTIONS: Array<{
  value: SupportedCurrency;
  label: string;
}> = [
  { value: 'ETB', label: 'ETB - Ethiopian Birr' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const LOCALIZATION_STORAGE_KEY = 'oictTutor.localization';

const resolveBrowserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Addis_Ababa';
  } catch (_error) {
    return 'Africa/Addis_Ababa';
  }
};

const buildTimeZoneOptions = (currentTimeZone: string) => {
  const baseOptions = [
    { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa' },
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi' },
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai' },
  ];

  if (!baseOptions.some((option) => option.value === currentTimeZone)) {
    return [{ value: currentTimeZone, label: currentTimeZone }, ...baseOptions];
  }

  return baseOptions;
};

const getInitialPreferences = (): LocalizationPreferences => {
  const defaults: LocalizationPreferences = {
    language: 'en',
    currency: 'ETB',
    timezone: resolveBrowserTimeZone(),
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  const stored = localStorage.getItem(LOCALIZATION_STORAGE_KEY);
  if (!stored) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<LocalizationPreferences>;

    return {
      language: parsed.language ?? defaults.language,
      currency: parsed.currency ?? defaults.currency,
      timezone: parsed.timezone ?? defaults.timezone,
    };
  } catch (_error) {
    return defaults;
  }
};

interface LocalizationContextValue extends LocalizationPreferences {
  locale: string;
  timeZoneOptions: Array<{ value: string; label: string }>;
  setLanguage: (language: SupportedLanguage) => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setTimezone: (timezone: string) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currencyOverride?: string) => string;
  formatDate: (
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ) => string;
  formatDateTime: (
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export const useLocalization = (): LocalizationContextValue => {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }

  return context;
};

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<LocalizationPreferences>(getInitialPreferences);

  const locale =
    LANGUAGE_OPTIONS.find((option) => option.value === preferences.language)?.locale || 'en-US';
  const timeZoneOptions = buildTimeZoneOptions(preferences.timezone);
  const activeMessages = messages[preferences.language] ?? messages.en;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(LOCALIZATION_STORAGE_KEY, JSON.stringify(preferences));
    document.documentElement.lang = locale;
  }, [locale, preferences]);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const template = String(activeMessages[key] ?? messages.en[key] ?? key);

    if (!params) {
      return template;
    }

    return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
      return result.split(`{${paramKey}}`).join(String(paramValue));
    }, template);
  };

  return (
    <LocalizationContext.Provider
      value={{
        ...preferences,
        locale,
        timeZoneOptions,
        setLanguage: (language) =>
          setPreferences((current) => ({
            ...current,
            language,
          })),
        setCurrency: (currency) =>
          setPreferences((current) => ({
            ...current,
            currency,
          })),
        setTimezone: (timezone) =>
          setPreferences((current) => ({
            ...current,
            timezone,
          })),
        t,
        formatCurrency: (amount, currencyOverride) =>
          formatCurrencyValue(amount, currencyOverride || preferences.currency, locale),
        formatDate: (value, options) =>
          formatDateValue(value, locale, preferences.timezone, options),
        formatDateTime: (value, options) =>
          formatDateTimeValue(value, locale, preferences.timezone, options),
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
