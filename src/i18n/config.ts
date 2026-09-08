/**
 * Locale + currency configuration.
 *
 * Hebrew is the default locale and is served without a URL prefix
 * (`/esim/thailand`). Every other locale is prefixed (`/en/esim/thailand`).
 * `src/proxy.ts` rewrites unprefixed requests onto the `[locale]` segment.
 */

export const locales = ['he', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'he';

export type Direction = 'rtl' | 'ltr';

export type LocaleConfig = {
  /** Value for the `lang` attribute. */
  htmlLang: string;
  dir: Direction;
  /** Name of the language in the language itself. */
  nativeName: string;
  /** BCP 47 tag used for Intl formatting. */
  intlLocale: string;
  defaultCurrency: CurrencyCode;
};

export const localeConfig: Record<Locale, LocaleConfig> = {
  he: {
    htmlLang: 'he',
    dir: 'rtl',
    nativeName: 'עברית',
    intlLocale: 'he-IL',
    defaultCurrency: 'ILS',
  },
  en: {
    htmlLang: 'en',
    dir: 'ltr',
    nativeName: 'English',
    intlLocale: 'en-US',
    defaultCurrency: 'USD',
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isCurrency(value: string): value is CurrencyCode {
  return (currencies as readonly string[]).includes(value);
}

/**
 * The chosen display currency is kept in a cookie rather than localStorage so
 * the server knows it too and can render prices in the right currency on the
 * first paint, instead of the page changing under the reader.
 */
export const CURRENCY_COOKIE = 'esimcompare_currency';

export const currencies = ['ILS', 'USD', 'EUR', 'GBP'] as const;
export type CurrencyCode = (typeof currencies)[number];

export const currencyConfig: Record<CurrencyCode, { symbol: string; label: string }> = {
  ILS: { symbol: '₪', label: 'ILS' },
  USD: { symbol: '$', label: 'USD' },
  EUR: { symbol: '€', label: 'EUR' },
  GBP: { symbol: '£', label: 'GBP' },
};

/**
 * Build a href for a locale. The default locale keeps clean, unprefixed URLs.
 *
 *   localePath('he', '/esim/thailand') -> '/esim/thailand'
 *   localePath('en', '/esim/thailand') -> '/en/esim/thailand'
 */
export function localePath(locale: Locale, path = '/'): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return normalized || '/';
  return `/${locale}${normalized}`;
}

/** Strip a locale prefix from a pathname, returning the locale-agnostic path. */
export function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname || '/';
}
