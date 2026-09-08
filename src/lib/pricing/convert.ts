import type { CurrencyCode } from '@/i18n/config';

export type FxRateSource = 'mock' | 'api';

export type FxRate = {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  /** ISO date. A converted price is only as fresh as this. */
  asOf: string;
  source: FxRateSource;
};

/**
 * A price as it is shown to the traveller.
 *
 * `isConverted` matters: a converted amount is an estimate, and the provider
 * will charge in `sourceCurrency`. The UI must say so rather than imply the
 * shekel figure is what gets billed.
 */
export type DisplayPrice = {
  currency: CurrencyCode;
  amountMinor: number;
  sourceCurrency: CurrencyCode;
  sourceAmountMinor: number;
  isConverted: boolean;
  fxRate: number | null;
  fxAsOf: string | null;
  fxSource: FxRateSource | null;
};

export function findRate(rates: FxRate[], from: CurrencyCode, to: CurrencyCode): FxRate | undefined {
  return rates.find((rate) => rate.from === from && rate.to === to);
}

/**
 * Convert a price into the display currency. Conversion is a separate layer on
 * purpose: components that render prices never convert, and a converted price
 * always carries its rate and timestamp so it can be labelled honestly.
 *
 * When no rate is available the source price is returned unconverted rather
 * than guessed.
 */
export function convertPrice(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: FxRate[],
): DisplayPrice {
  const base = { sourceCurrency: from, sourceAmountMinor: amountMinor };

  if (from === to) {
    return {
      ...base,
      currency: to,
      amountMinor,
      isConverted: false,
      fxRate: null,
      fxAsOf: null,
      fxSource: null,
    };
  }

  const rate = findRate(rates, from, to);
  if (!rate) {
    return {
      ...base,
      currency: from,
      amountMinor,
      isConverted: false,
      fxRate: null,
      fxAsOf: null,
      fxSource: null,
    };
  }

  return {
    ...base,
    currency: to,
    amountMinor: Math.round(amountMinor * rate.rate),
    isConverted: true,
    fxRate: rate.rate,
    fxAsOf: rate.asOf,
    fxSource: rate.source,
  };
}
