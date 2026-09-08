import { currencyConfig, localeConfig, type CurrencyCode, type Locale } from '@/i18n/config';

/**
 * Prices are stored as integers in the currency's minor unit (agorot, cents)
 * so that arithmetic never drifts through floating point.
 */
export function toMajorUnits(amountMinor: number): number {
  return amountMinor / 100;
}

/**
 * Format a price for display as symbol-first — "₪59", "$18.20" — which is the
 * convention Israeli shoppers read fastest and the one the approved design
 * uses. Grouping and decimal separators still come from the locale via Intl;
 * only the symbol's position is ours.
 *
 * Whole amounts drop the decimals, while per-unit values such as ₪2.95/GB
 * keep them.
 */
export function formatPrice(
  amountMinor: number,
  currency: CurrencyCode,
  locale: Locale,
  options: { alwaysShowDecimals?: boolean } = {},
): string {
  const amount = toMajorUnits(amountMinor);
  const isWhole = Number.isInteger(amount);
  const fractionDigits = options.alwaysShowDecimals || !isWhole ? 2 : 0;

  const number = new Intl.NumberFormat(localeConfig[locale].intlLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  return `${currencyConfig[currency].symbol}${number}`;
}

/** Currency symbol on its own, for compact labels. */
export function currencySymbol(currency: CurrencyCode): string {
  return currencyConfig[currency].symbol;
}
