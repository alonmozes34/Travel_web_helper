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
export const CURRENCY_COOKIE = 'yeshklita_currency';

/**
 * Display currencies.
 *
 * Every one of these is published daily by the European Central Bank, which
 * is where the real rates come from, and every one of them has two decimal
 * places. That second condition is load-bearing rather than tidy: prices are
 * stored in minor units and `toMajorUnits` divides by a hundred, so a
 * zero-decimal currency — the yen, the won — would render a hundred times its
 * real value. Adding one means teaching the pricing layer about minor-unit
 * exponents first, not adding a line here.
 */
export const currencies = [
  'ILS',
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'NZD',
] as const;
export type CurrencyCode = (typeof currencies)[number];

export const currencyConfig: Record<CurrencyCode, { symbol: string; label: string }> = {
  ILS: { symbol: '₪', label: 'ILS' },
  USD: { symbol: '$', label: 'USD' },
  EUR: { symbol: '€', label: 'EUR' },
  GBP: { symbol: '£', label: 'GBP' },
  AUD: { symbol: 'A$', label: 'AUD' },
  CAD: { symbol: 'C$', label: 'CAD' },
  CHF: { symbol: 'CHF', label: 'CHF' },
  NZD: { symbol: 'NZ$', label: 'NZD' },
};

/**
 * The currency a visitor is shown before they choose one.
 *
 * Only the two locales have a default of their own; everything else is
 * reached by asking for it, either in the switcher or with `?currency=` on
 * any URL. There is deliberately no guessing from an IP address: a shekel
 * price shown to somebody in Berlin because a geolocation database placed
 * them in Tel Aviv is worse than a dollar price they can change in one tap.
 */
export const CURRENCY_PARAM = 'currency';

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
