import { isCurrency } from '@/i18n/config';
import { getCountryByCode } from '@/data/countries';
import type { PlanCoverage } from '@/lib/types/coverage';
import type { Plan } from '@/lib/types/plan';
import type { SkippedRecord } from '../ProviderSource';
import type { YesimPlan } from './types';

export const YESIM_PROVIDER_ID = 'yesim';

/** Their names for plans that cover the world rather than a region. */
const GLOBAL_NAMES = new Set(['global package', 'global plus package', 'unlim day pass']);

/** Their region names that mean the same as one of ours. Only Europe: the rest are their own groupings. */
const REGION_IDS: Record<string, string> = { europe: 'europe' };

/**
 * Two of their region names are written as codes. Spelled out the way their
 * own pages are addressed (`/regions/south-east-asia-esim/`,
 * `/regions/middle-east-esim/`); "CIS" is left as they write it.
 */
const REGION_NAMES: Record<string, string> = { SEA: 'South East Asia', 'MIDDLE EAST': 'Middle East' };

export type MappedYesimPlan = { plan: Plan } | { skipped: SkippedRecord };

/**
 * One Yesim plan onto the site's plan shape.
 *
 * Only what the API states. It names no networks and says nothing about
 * hotspot, calls, SMS or top-up, so those are empty or null — not "no". Its
 * unlimited plans say "Possible throttling" and nothing more: not after how
 * much, not to what speed. That is recorded as a cap whose terms are not
 * stated, which the page says in those words and the ranking reads the least
 * generous way.
 *
 * A single-country plan is placed by `country_code`, never by the network
 * list: Yesim's Northern Cyprus plans list Turkey's code there, and a Northern
 * Cyprus plan offered as a Turkey plan would be wrong.
 */
export function mapYesimPlan(item: YesimPlan, fetchedAt: string): MappedYesimPlan {
  const label = `${item.planName} ${item.capacity}${item.capacityUnit} ${item.period}d`;
  const skip = (reason: SkippedRecord['reason'], detail: string): MappedYesimPlan => ({
    skipped: { externalId: item.plan_id, label, reason, detail },
  });

  if (!item.plan_id) return skip('unknown-provider', 'no plan_id');

  const coverage = coverageFor(item);
  if (!coverage) {
    return skip('unknown-destination', `country_code ${JSON.stringify(item.country_code)}, ${item.coverages.length} coverages`);
  }

  const unlimited = item.capacity.trim() === '-1';
  const megabytes = Number(item.capacity);
  if (!unlimited && !(item.capacityUnit === 'MB' && Number.isFinite(megabytes) && megabytes > 0)) {
    return skip('unparsable-allowance', `capacity "${item.capacity}" ${item.capacityUnit}`);
  }

  const days = Number(item.period);
  if (!(Number.isInteger(days) && days > 0)) return skip('unparsable-validity', `period "${item.period}"`);

  const currency = item.currency.toUpperCase();
  if (!isCurrency(currency)) return skip('unsupported-currency', `currency "${item.currency}"`);
  const priceMinor = toMinor(item.price);
  if (priceMinor === null) return skip('missing-price', `price "${item.price}"`);

  const planLink = yesimPlanLink(item);
  const allowance = unlimited ? 'Unlimited' : megabytes >= 1024 ? `${round1(megabytes / 1024)}GB` : `${megabytes}MB`;

  return {
    plan: {
      id: `yesim-${item.plan_id}`,
      providerId: YESIM_PROVIDER_ID,
      planName: `${item.planName} ${allowance} ${days} ${days === 1 ? 'Day' : 'Days'}`,
      coverage,
      dataAmountMb: unlimited ? 0 : megabytes,
      isUnlimited: unlimited,
      // "Possible throttling": a cap exists, its terms are not given.
      fairUsage: unlimited && item.capacityInfo ? { thresholdMb: null, per: null, throttledToKbps: null } : null,
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
      // The plan's own page where its address is known (`yesimPlanLink`);
      // otherwise the destination page, which the catalogue does not list.
      ...(planLink
        ? { affiliateUrl: planLink, affiliateLandsOn: 'plan' as const }
        : { affiliateUrl: item.url || null, affiliateLandsOn: 'destination' as const }),
      source: 'api',
      lastUpdatedAt: fetchedAt,
    },
  };
}

/**
 * Off until the owner has opened a few built addresses for other countries
 * and lengths (asked for on 28 September 2026) and seen each open on its
 * plan: one address, for Japan, is the whole evidence so far. While off,
 * every Yesim plan keeps its destination link and stays off the site.
 */
export const YESIM_PLAN_PAGES = false;

/**
 * The address of a plan's own page on yesim.app, with our partner id — or
 * null where that address is not known.
 *
 * Their API gives only the destination page. Their plan pages follow a
 * pattern the owner found on their site on 28 September 2026:
 *
 *   https://yesim.app/country/japan/10days-unlimited-esim-data-plan/
 *
 * which opened on Japan, unlimited, 10 days at the API's €28.81, and did the
 * same with `?partner_id=` added (their dashboard: "add your partner ID to any
 * URL on yesim.app"). Only that shape is built: a single-country unlimited
 * plan of two days or more. One day ("1day" or "1days"?), plans with a data
 * cap, regions and global plans have not been seen, so they get null and stay
 * off the site rather than send someone to a page that may not exist.
 */
export function yesimPlanLink(
  item: YesimPlan,
  { enabled = YESIM_PLAN_PAGES }: { enabled?: boolean } = {},
): string | null {
  if (!enabled) return null;
  if (!item.country_code || item.capacity.trim() !== '-1') return null;
  const days = Number(item.period);
  if (!(Number.isInteger(days) && days >= 2)) return null;

  let destination: URL;
  let partnerId: string | null;
  try {
    destination = new URL(item.directLink);
    partnerId = new URL(item.url).searchParams.get('partner_id');
  } catch {
    return null;
  }
  if (destination.hostname !== 'yesim.app' || !/^\/country\/[a-z0-9-]+\/?$/.test(destination.pathname)) return null;
  if (!partnerId || !/^\d+$/.test(partnerId)) return null;

  const base = destination.pathname.replace(/\/+$/, '');
  return `https://yesim.app${base}/${days}days-unlimited-esim-data-plan/?partner_id=${partnerId}`;
}

function coverageFor(item: YesimPlan): PlanCoverage | null {
  if (item.country_code) {
    const code = item.country_code.toUpperCase();
    return getCountryByCode(code)
      ? { kind: 'country', countries: [code], regionId: null, publishedDestinationCount: null }
      : null;
  }
  const countries = [...new Set(item.coverages.map((entry) => entry.code.toUpperCase()))].filter((code) =>
    getCountryByCode(code),
  );
  if (countries.length === 0) return null;
  const name = item.planName.trim();
  if (GLOBAL_NAMES.has(name.toLowerCase())) {
    return { kind: 'global', countries, regionId: null, publishedDestinationCount: null };
  }
  const regionId = REGION_IDS[name.toLowerCase()] ?? null;
  return {
    kind: 'region',
    countries,
    regionId,
    ...(regionId ? {} : { regionName: REGION_NAMES[name] ?? name }),
    publishedDestinationCount: null,
  };
}

/** "28.81" → 2881. Null for anything that is not a positive amount with at most two decimals. */
function toMinor(text: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(text?.trim() ?? '')) return null;
  const minor = Math.round(Number(text) * 100);
  return minor > 0 ? minor : null;
}

function round1(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}
