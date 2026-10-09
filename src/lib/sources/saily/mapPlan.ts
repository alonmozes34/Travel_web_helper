import { isCurrency } from '@/i18n/config';
import { getCountryByCode } from '@/data/countries';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { PlanCoverage } from '@/lib/types/coverage';
import type { FairUsage, Plan } from '@/lib/types/plan';
import type { SkippedRecord } from '../ProviderSource';
import type { SailyPlan } from './types';

export const SAILY_PROVIDER_ID = 'saily';
/** Our offer in Saily's TUNE affiliate network — the same for every plan. */
export const SAILY_OFFER_ID = '101';

/**
 * Their bundle pages that mean the same as one of our regions. Only Europe:
 * their "North America" is three countries, and their other bundles are
 * their own groupings, so those keep Saily's names.
 */
const REGION_IDS: Record<string, string> = { 'esim-europe': 'europe' };

export type MappedSailyPlan = { plan: Plan } | { skipped: SkippedRecord };

/**
 * One Saily plan onto the site's plan shape, if its page sells it.
 *
 * Only what the API states. It names no networks and says nothing about
 * hotspot, calls, SMS or top-up, so those are left unstated. An unlimited
 * plan's terms are in the API as numbers, and read as Saily's own page
 * words them: "You get 5GB of standard data every day. When that limit is
 * reached, your internet speed will drop to 1 Mbps until the next day."
 *
 * `offered` is what the plan's own saily.com page sells, plan id to price
 * in US cents, as `scripts/check-saily-pages.ts` read it from the schema.org
 * data the page publishes. A plan the page does not sell at the API's price
 * is left out: on 9 October 2026, 150 of the API's 1,184 plans were not on
 * their pages — Thailand unlimited for 7 days at US$28.99 in the API, a
 * different plan at US$20.99 on saily.com — and a link to one would open on
 * a plan the visitor did not choose, at a price we did not show. The owner
 * allowed reading their pages for this check only, on 9 October 2026; every
 * price shown is still the API's. `'unchecked'` maps without it — only to
 * choose which pages to read.
 */
export function mapSailyPlan(
  item: SailyPlan,
  {
    affiliateId,
    fetchedAt,
    offered,
  }: { affiliateId: string; fetchedAt: string; offered: ReadonlyMap<string, number> | 'unchecked' },
): MappedSailyPlan {
  const label = item.name ?? item.identifier;
  const skip = (reason: SkippedRecord['reason'], detail: string): MappedSailyPlan => ({
    skipped: { externalId: item.identifier, label, reason, detail },
  });

  if (!item.identifier) return skip('unknown-provider', 'no identifier');
  // "Ultra" plans renew every billing cycle on saily.com, which the API does
  // not say, and their pages do not list them.
  if (item.category !== 'standard') return skip('unsupported-plan-type', `category "${item.category}"`);

  const coverage = coverageFor(item);
  if (!coverage) {
    return skip('unknown-destination', `${item.pricing_slug}: ${item.covered_countries.slice(0, 5).join(', ')}`);
  }

  const balance = item.balances?.[0];
  const unlimited = item.is_unlimited === true;
  const megabytes = balance && balance.type === 'DATA' ? toMegabytes(balance.amount, balance.unit) : null;
  if (!unlimited && !(megabytes && megabytes > 0)) {
    return skip('unparsable-allowance', `balance ${JSON.stringify(balance ?? null)}`);
  }

  const days = item.duration?.amount;
  if (item.duration?.unit !== 'day' || !(Number.isInteger(days) && days > 0)) {
    return skip('unparsable-validity', `duration ${JSON.stringify(item.duration ?? null)}`);
  }

  const currency = item.price?.currency?.toUpperCase() ?? '';
  if (!isCurrency(currency)) return skip('unsupported-currency', `currency "${item.price?.currency}"`);
  const priceMinor = item.price.amount_with_tax;
  if (!(Number.isInteger(priceMinor) && priceMinor > 0)) return skip('missing-price', `amount_with_tax ${priceMinor}`);

  const link = sailyPlanLink(item, affiliateId);
  if (!link) return skip('unknown-destination', `destination_url ${item.destination_url}`);

  const onPage = offered === 'unchecked' ? priceMinor : offered.get(item.identifier);
  if (currency !== 'USD' || onPage !== priceMinor) {
    return skip(
      'not-offered',
      onPage === undefined
        ? `not offered on saily.com/${item.pricing_slug}/`
        : `US$${(priceMinor / 100).toFixed(2)} in the API, US$${(onPage / 100).toFixed(2)} on saily.com/${item.pricing_slug}/`,
    );
  }

  return {
    plan: {
      id: `saily-${item.identifier}`,
      providerId: SAILY_PROVIDER_ID,
      planName: item.name,
      coverage,
      dataAmountMb: unlimited ? 0 : (megabytes as number),
      isUnlimited: unlimited,
      fairUsage: unlimited ? readFairUsage(item, days) : null,
      validityDays: days,
      sourceCurrency: currency,
      originalPriceMinor: priceMinor,
      finalPriceMinor: priceMinor,
      discount: null,
      localPricesMinor: {},
      networks: [],
      hotspot: null,
      calls: null,
      sms: null,
      topUp: null,
      affiliateUrl: link,
      affiliateLandsOn: 'plan',
      source: 'api',
      lastUpdatedAt: fetchedAt,
    },
  };
}

/**
 * Our tracking link, carrying the plan's own page: their TUNE link takes a
 * destination in `url`, fills in its click macros, and opens saily.com with
 * the plan selected. Saily wrote on 9 October 2026 that deeplinking "is not
 * yet available"; the API's `destination_url` is built for exactly this, and
 * the link opened the Thailand 20GB page with that plan selected and our
 * affiliate id that day. Null where the destination is not that plan's page.
 */
export function sailyPlanLink(item: SailyPlan, affiliateId: string): string | null {
  let destination: URL;
  try {
    destination = new URL(decodeURIComponent(item.destination_url));
  } catch {
    return null;
  }
  if (destination.protocol !== 'https:' || destination.hostname !== 'saily.com') return null;
  if (!/^\/esim-[a-z0-9-]+(\/[a-z0-9-]+)?\/?$/.test(destination.pathname)) return null;
  if (destination.searchParams.get('selectedPlan') !== item.identifier) return null;

  const link = new URL('https://go.saily.site/aff_c');
  link.searchParams.set('offer_id', SAILY_OFFER_ID);
  link.searchParams.set('aff_id', affiliateId);
  link.searchParams.set('url', destination.toString());
  return link.toString();
}

/** The page on saily.com a plan's link opens, where its offer is published. */
export function sailyPlanPage(item: SailyPlan): string | null {
  try {
    const destination = new URL(decodeURIComponent(item.destination_url));
    if (destination.hostname !== 'saily.com') return null;
    return `https://saily.com${destination.pathname.replace(/\/?$/, '/')}`;
  } catch {
    return null;
  }
}

function coverageFor(item: SailyPlan): PlanCoverage | null {
  const codes = [...new Set((item.covered_countries ?? []).map((code) => code.toUpperCase()))];
  if (codes.length === 1) {
    // A country's own page only. "esim-united-states/hawaii" is Hawaii, and
    // a page under a country is a part of it, never the whole country.
    if (item.pricing_slug.includes('/')) return null;
    return getCountryByCode(codes[0])
      ? { kind: 'country', countries: codes, regionId: null, publishedDestinationCount: null }
      : null;
  }
  const countries = codes.filter((code) => getCountryByCode(code));
  if (countries.length === 0) return null;
  if (item.pricing_slug === 'esim-global') {
    return { kind: 'global', countries, regionId: null, publishedDestinationCount: null };
  }
  const regionId = REGION_IDS[item.pricing_slug] ?? null;
  // "Asia and Oceania 20GB 30 days" → "Asia and Oceania".
  const regionName = item.name.replace(/\s+(UNLIMITED|\d+(?:\.\d+)?\s?[GM]B)\s+\d+\s+days?$/i, '').trim();
  return {
    kind: 'region',
    countries,
    regionId,
    ...(regionId ? {} : { regionName }),
    publishedDestinationCount: null,
  };
}

function readFairUsage(item: SailyPlan, validityDays: number): FairUsage {
  const metadata = item.merchant_plans?.[0]?.metadata ?? {};
  const threshold = metadata.unrestricted_data
    ? toMegabytes(metadata.unrestricted_data.amount, metadata.unrestricted_data.unit)
    : null;
  const speed = metadata.throttled_speed
    ? toKbps(metadata.throttled_speed.amount, metadata.throttled_speed.unit)
    : null;
  const after = metadata.unrestricted_data_after;
  const per =
    after?.unit === 'DAY' ? (after.interval === 1 ? 'day' : after.interval === validityDays ? 'plan' : null) : null;
  return { thresholdMb: threshold, per: threshold ? per : null, throttledToKbps: speed };
}

function toMegabytes(amount: number, unit: string): number | null {
  if (!(typeof amount === 'number' && amount > 0)) return null;
  if (unit === 'GB') return Math.round(amount * MB_PER_GB);
  if (unit === 'MB') return Math.round(amount);
  return null;
}

function toKbps(amount: number, unit: string): number | null {
  if (!(typeof amount === 'number' && amount > 0)) return null;
  if (unit === 'MBPS') return Math.round(amount * 1000);
  if (unit === 'KBPS') return Math.round(amount);
  return null;
}
