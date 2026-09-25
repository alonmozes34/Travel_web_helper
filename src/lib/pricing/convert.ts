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
 * The currency every rate is published against, and crossed through.
 *
 * The European Central Bank publishes one reference rate per currency against
 * the euro, once a day. Every pair the application needs is derived from
 * those — A to B is (EUR to B) divided by (EUR to A) — so a feed of N rates
 * covers all N x (N-1) pairs. At eight currencies a hand-kept table of pairs
 * would be fifty-six numbers that have to stay consistent with each other;
 * as seven euro rates, an inconsistency is not expressible.
 */
export const RATE_BASE: CurrencyCode = 'EUR';

/**
 * Expands one rate per currency against the euro into every pair.
 *
 * Shared by the live feed and the mock table so the two cannot drift into
 * different arithmetic, and rounded on the way out: the division comes back
 * as 3.045289855072464, which is float noise that would be rendered as if it
 * were precision. Six places is more than any price needs.
 */
export function crossThroughBase(
  perBase: ReadonlyMap<CurrencyCode, number>,
  all: readonly CurrencyCode[],
  asOf: string,
  source: FxRateSource,
): FxRate[] {
  const rates: FxRate[] = [];
  for (const from of all) {
    for (const to of all) {
      if (from === to) continue;
      const fromRate = perBase.get(from);
      const toRate = perBase.get(to);
      if (!fromRate || !toRate) continue;
      rates.push({
        from,
        to,
        rate: Math.round((toRate / fromRate) * 1e6) / 1e6,
        asOf,
        source,
      });
    }
  }
  return rates;
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

/**
 * A plan's price in the traveller's currency.
 *
 * When the provider has its own price in that currency, that price is used and
 * nothing is converted: it is the figure their checkout will show. Otherwise
 * the amount is converted as usual. `amountMinor` is in the plan's source
 * currency — the final or the original price — and the provider's own price is
 * scaled by the same ratio, so a discount applies to both alike.
 */
export function planPrice(
  plan: { sourceCurrency: CurrencyCode; originalPriceMinor: number; localPricesMinor?: Partial<Record<CurrencyCode, number>> },
  amountMinor: number,
  to: CurrencyCode,
  rates: FxRate[],
): DisplayPrice {
  const local = plan.localPricesMinor?.[to];
  if (to !== plan.sourceCurrency && local && plan.originalPriceMinor > 0) {
    const localAmount = Math.round((local * amountMinor) / plan.originalPriceMinor);
    return {
      currency: to,
      amountMinor: localAmount,
      sourceCurrency: to,
      sourceAmountMinor: localAmount,
      isConverted: false,
      fxRate: null,
      fxAsOf: null,
      fxSource: null,
    };
  }
  return convertPrice(amountMinor, plan.sourceCurrency, to, rates);
}
