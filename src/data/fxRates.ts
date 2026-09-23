import { crossThroughBase, type FxRate } from '@/lib/pricing/convert';
import { currencies, type CurrencyCode } from '@/i18n/config';

/**
 * MOCK exchange rates.
 *
 * Every rate carries `source: 'mock'` and an `asOf` date, so a converted price
 * can never be presented as a live figure. The real feed — the European
 * Central Bank's daily reference rates, in `src/lib/sources/ecb` — replaces
 * these without touching the conversion layer.
 *
 * Held as one rate per currency against the euro and expanded by the same
 * function the live feed uses, so the fallback and the real thing cannot
 * drift into different arithmetic.
 */
export const MOCK_FX_AS_OF = '2026-09-01';

const perEuro = new Map<CurrencyCode, number>([
  ['EUR', 1],
  ['ILS', 3.77],
  ['USD', 1.164],
  ['GBP', 0.867],
  ['AUD', 1.76],
  ['CAD', 1.58],
  ['CHF', 0.94],
  ['NZD', 1.93],
]);

export const mockFxRates: FxRate[] = crossThroughBase(
  perEuro,
  currencies,
  MOCK_FX_AS_OF,
  'mock',
);
