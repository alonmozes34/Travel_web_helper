import { cached } from '@/lib/catalogue/cache';
import { ECB_DAILY_URL } from './ecbRateSource';

/**
 * What one unit of a destination's money is worth in shekels, for the
 * "before you go" facts on a country page: "100 Thai baht ≈ ₪10.40".
 *
 * From the same European Central Bank daily feed as the price conversions,
 * but every currency it lists (about thirty: the baht, the yen, the forint,
 * the lira…), not only the eight a price can be shown in. A currency the ECB
 * does not publish gets no rate, rather than one from elsewhere.
 */
export type LocalRates = {
  /** Shekels per one unit of the currency, by ISO code. */
  ilsPer: Map<string, number>;
  /** The ECB's reference date. */
  asOf: string;
};

export function parseLocalRates(xml: string): LocalRates {
  const asOf = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  if (!asOf) throw new Error('ECB feed carried no date');
  const perEuro = new Map<string, number>([['EUR', 1]]);
  for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
    const rate = Number.parseFloat(match[2]);
    if (Number.isFinite(rate) && rate > 0) perEuro.set(match[1], rate);
  }
  const ils = perEuro.get('ILS');
  if (!ils) throw new Error('ECB feed is missing ILS');
  const ilsPer = new Map<string, number>();
  for (const [code, rate] of perEuro) if (code !== 'ILS') ilsPer.set(code, ils / rate);
  return { ilsPer, asOf };
}

/**
 * How many units to quote so the shekel figure reads naturally: one dollar
 * (₪3.70), a hundred yen (₪2.45), ten thousand rupiah (₪2.20).
 */
export function quoteUnits(ilsPerUnit: number): number {
  for (const units of [1, 100, 1000, 10_000]) if (ilsPerUnit * units >= 1) return units;
  return 100_000;
}

const RATES_TTL_MS = 6 * 60 * 60 * 1000;

const rates = cached({
  load: async () => {
    const response = await fetch(ECB_DAILY_URL, { headers: { Accept: 'application/xml' } });
    if (!response.ok) throw new Error(`ECB responded ${response.status}`);
    return parseLocalRates(await response.text());
  },
  ttlMs: RATES_TTL_MS,
  staleWhileRevalidate: true,
});

/** The rates, or null when the ECB cannot be reached: the page then shows none. */
export async function getLocalRates(): Promise<LocalRates | null> {
  try {
    return (await rates.get()).value;
  } catch {
    return null;
  }
}
