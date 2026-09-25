import { isCurrency, type CurrencyCode } from '@/i18n/config';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { PlanCoverage } from '@/lib/types/coverage';
import type { Network, NetworkTechnology } from '@/lib/types/network';
import type { FairUsage, Plan } from '@/lib/types/plan';
import type { SkippedRecord } from '../ProviderSource';
import { alpha3ToAlpha2 } from './countryCodes';
import type { AlosimNetwork, AlosimPlan } from './types';

export const ALOSIM_PROVIDER_ID = 'alosim';

/**
 * Their bundle names that mean the same as one of our regions. Only these:
 * their "North America" is three countries and ours includes Central America,
 * so it keeps their name rather than borrowing a larger one of ours.
 */
const REGION_IDS: Record<string, string> = {
  europe: 'europe',
  asia: 'asia',
  'south america': 'south-america',
  caribbean: 'caribbean',
};

export type MappedAlosimPlan = { plan: Plan } | { skipped: SkippedRecord };

/**
 * One aloSIM plan onto the site's plan shape.
 *
 * Only what the API states. It says nothing about hotspot, calls, SMS or
 * top-up, so those are null — not "no". It gives an unlimited plan's
 * full-speed allowance without saying whether it is per day, so `per` is null
 * until aloSIM tell us. A record that cannot be read goes to `skipped` with the
 * reason, never onto the page with a guess.
 */
export function mapAlosimPlan(
  item: AlosimPlan,
  fetchedAt: string,
  linkFor: (item: AlosimPlan, countryCodes: string[]) => string | null,
): MappedAlosimPlan {
  const planId = readPlanId(item.url);
  const label = `${titleCase(item.name)} ${item.dataGigabytes} ${item.validityDays}d`;
  const skip = (reason: SkippedRecord['reason'], detail: string): MappedAlosimPlan => ({
    skipped: { externalId: planId ?? item.url, label, reason, detail },
  });

  if (!planId) return skip('unknown-provider', `no plan_id in "${item.url}"`);

  const countries = [...new Set(item.locations.map((code) => alpha3ToAlpha2[code]).filter(Boolean))];
  if (countries.length === 0) {
    return skip('unknown-destination', `no known country in ${JSON.stringify(item.locations)}`);
  }

  const unlimited = item.dataGigabytes.trim().toLowerCase() === 'unlimited';
  const gigabytes = unlimited ? 0 : Number(item.dataGigabytes);
  if (!unlimited && !(Number.isFinite(gigabytes) && gigabytes > 0)) {
    return skip('unparsable-allowance', `dataGigabytes "${item.dataGigabytes}"`);
  }

  if (!(Number.isInteger(item.validityDays) && item.validityDays > 0)) {
    return skip('unparsable-validity', `validityDays ${item.validityDays}`);
  }

  const currency = item.currency.toUpperCase();
  if (!isCurrency(currency)) return skip('unsupported-currency', `currency "${item.currency}"`);
  if (!(Number.isInteger(item.price) && item.price > 0)) {
    return skip('missing-price', `price ${item.price}`);
  }

  const localPricesMinor: Partial<Record<CurrencyCode, number>> = {};
  for (const [code, amount] of Object.entries(item.prices ?? {})) {
    if (isCurrency(code) && code !== currency && Number.isInteger(amount) && amount > 0) {
      localPricesMinor[code] = amount;
    }
  }

  const allowance = unlimited ? 'Unlimited' : `${formatGb(gigabytes)}GB`;

  return {
    plan: {
      id: `alosim-${planId}`,
      providerId: ALOSIM_PROVIDER_ID,
      // Their own wording and order ("North America 2GB 7 Days"), so the plan
      // can be found on their page by name.
      planName: `${titleCase(item.name)} ${allowance} ${item.validityDays} ${item.validityDays === 1 ? 'Day' : 'Days'}`,
      coverage: coverageFor(item, countries),
      dataAmountMb: unlimited ? 0 : Math.round(gigabytes * MB_PER_GB),
      isUnlimited: unlimited,
      fairUsage: unlimited ? readFairUsage(item) : null,
      validityDays: item.validityDays,
      sourceCurrency: currency,
      originalPriceMinor: item.price,
      finalPriceMinor: item.price,
      discount: null,
      localPricesMinor,
      networks: item.providers.flatMap(readNetwork),
      hotspot: null,
      calls: null,
      sms: null,
      topUp: null,
      affiliateUrl: linkFor(item, countries),
      source: 'api',
      lastUpdatedAt: fetchedAt,
    },
  };
}

function coverageFor(item: AlosimPlan, countries: string[]): PlanCoverage {
  const name = item.name.trim();
  if (item.locations.length === 1) {
    return { kind: 'country', countries, regionId: null, publishedDestinationCount: null };
  }
  if (name.toLowerCase() === 'global') {
    return { kind: 'global', countries, regionId: null, publishedDestinationCount: null };
  }
  const regionId = REGION_IDS[name.toLowerCase()] ?? null;
  return {
    kind: 'region',
    countries,
    regionId,
    ...(regionId ? {} : { regionName: titleCase(name) }),
    publishedDestinationCount: null,
  };
}

function readFairUsage(item: AlosimPlan): FairUsage | null {
  const threshold = parseAmount(item.dataBeforeThrottle, { gb: MB_PER_GB, mb: 1 });
  const speed = parseAmount(item.throttleSpeed, { mbps: 1000, kbps: 1 });
  if (threshold === null && speed === null) return null;
  // "3 GB" with no period. Whether that is per day or per plan is the
  // question put to aloSIM; until they answer, the page does not say "a day".
  return { thresholdMb: threshold, per: null, throttledToKbps: speed };
}

function readNetwork(entry: AlosimNetwork): Network[] {
  const countryCode = alpha3ToAlpha2[entry.countryCode];
  const operator = entry.network.trim();
  if (!countryCode || !operator) return [];
  // Only what the field says: "5G" is 5G, "LTE" is 4G. A 3G or 2G network is
  // listed without either, and 5G is not taken to imply 4G.
  const technologies: NetworkTechnology[] =
    entry.speed === '5G' ? ['5G'] : entry.speed === 'LTE' ? ['4G'] : [];
  return [{ countryCode, operator, mccMnc: null, technologies, coverage: null }];
}

function readPlanId(url: string): string | null {
  try {
    return new URL(url).searchParams.get('plan_id');
  } catch {
    return null;
  }
}

/** "3 GB" → 3072 with `{ gb: 1024 }`. Null when the text is not a number and a known unit. */
function parseAmount(text: string, units: Record<string, number>): number | null {
  const match = /^\s*([\d.]+)\s*([a-z]+)\s*$/i.exec(text ?? '');
  if (!match) return null;
  const factor = units[match[2].toLowerCase()];
  const value = Number(match[1]);
  return factor && Number.isFinite(value) && value > 0 ? Math.round(value * factor) : null;
}

const ACRONYMS = new Set(['uk', 'usa', 'uae', 'nz', 'us']);
const SMALL_WORDS = new Set(['and', 'of', 'the']);

/** Their names arrive lower-case ("united kingdom (uk)"); shown as "United Kingdom (UK)". */
function titleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      if (ACRONYMS.has(lower.replace(/[().]/g, ''))) return word.toUpperCase();
      return lower.replace(/(^|[-.(])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase());
    })
    .join(' ');
}

function formatGb(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}
