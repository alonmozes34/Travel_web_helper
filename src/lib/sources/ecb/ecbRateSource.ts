import { currencies, type CurrencyCode } from '@/i18n/config';
import { crossThroughBase, RATE_BASE, type FxRate } from '@/lib/pricing/convert';
import type { RateResult, RateSource } from '../RateSource';

/**
 * Exchange rates from the European Central Bank's daily reference feed.
 *
 * The first piece of data in this project that is not invented. It needs no
 * key, no account and no approval — which is why it could be made real while
 * everything about the provider catalogue is still waiting on a partner
 * programme.
 *
 * The feed is EUR-based and publishes one rate per currency, once per TARGET
 * business day. Every pair the application needs is derived from those by
 * crossing through the euro: A→B is (EUR→B) / (EUR→A). That is exact for our
 * purposes and avoids inventing a rate the ECB did not publish.
 *
 * What it is not: a dealing rate. The ECB publishes reference rates for
 * information, a card issuer will use its own, and the interface already says
 * the shekel figure is an estimate and states the date it came from. A rate
 * that is a day old is normal — this is a comparison, not a checkout.
 */
export const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

export function ecbRateSource({
  url = ECB_DAILY_URL,
  fetchText = defaultFetchText,
  now = () => new Date().toISOString(),
}: {
  url?: string;
  /** Injected so the parser can be tested without the network. */
  fetchText?: (url: string) => Promise<string>;
  now?: () => string;
} = {}): RateSource {
  return {
    id: 'ecb',
    label: 'European Central Bank daily reference rates',
    async fetch(): Promise<RateResult> {
      const xml = await fetchText(url);
      return { sourceId: 'ecb', rates: parseEcbDaily(xml), fetchedAt: now() };
    },
  };
}

/**
 * Reads the feed into every pair we can be asked for.
 *
 * Throws rather than returning a partial set. A missing currency would leave
 * one conversion silently falling back to a stale or mock rate while the
 * others were fresh, and a page mixing the two is worse than a page that
 * keeps the whole previous set — which is what the cache does on a failure.
 */
export function parseEcbDaily(xml: string): FxRate[] {
  const asOf = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  if (!asOf) throw new Error('ECB feed carried no date');

  // The base is not listed as a rate against itself.
  const perEuro = new Map<CurrencyCode, number>([[RATE_BASE, 1]]);
  for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
    const code = match[1];
    if (!(currencies as readonly string[]).includes(code)) continue;
    const rate = Number.parseFloat(match[2]);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error(`ECB rate for ${code} is not usable: ${match[2]}`);
    perEuro.set(code as CurrencyCode, rate);
  }

  const missing = currencies.filter((code) => !perEuro.has(code));
  if (missing.length > 0) throw new Error(`ECB feed is missing ${missing.join(', ')}`);

  return crossThroughBase(perEuro, currencies, asOf, 'api');
}

async function defaultFetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: 'application/xml' } });
  if (!response.ok) throw new Error(`ECB responded ${response.status}`);
  return response.text();
}
