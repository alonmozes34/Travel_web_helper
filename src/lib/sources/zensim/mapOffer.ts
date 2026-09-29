import { getCountryByCode } from '@/data/countries';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Plan } from '@/lib/types/plan';
import type { SkippedRecord } from '../ProviderSource';

export const ZENSIM_PROVIDER_ID = 'zensim';

/**
 * One plan as ZenSim publish it in the schema.org data on their country pages
 * (`<script type="application/ld+json">`, an `Offer` inside a `Product`) — the
 * data they put there for search engines. As it read on 29 September 2026:
 *
 *   { "@type": "Offer",
 *     "url": "https://zensim.com/travel-esims/japan/?id=USD-JP-20GB-15-days&plan=20gb&duration=15&currency=USD",
 *     "name": "Japan Travel eSIM 20GB 15 days", "price": "23.00", "priceCurrency": "USD" }
 */
export type ZensimOffer = {
  url?: unknown;
  name?: unknown;
  price?: unknown;
  priceCurrency?: unknown;
};

export type MappedZensimOffer = { plan: Plan } | { skipped: SkippedRecord };

/**
 * `USD-JP-20GB-15-days`, `USD-JP-UNLIMITED-5-days`, `USD-JP-500MB-1-days`.
 * The second part is the ISO country; a regional plan has `REGION-ASIA` there
 * and does not match — which countries a region covers is not in the data, and
 * is not guessed.
 */
const PLAN_ID = /^([A-Z]{3})-([A-Z]{2})-(UNLIMITED|\d+(?:\.\d+)?(?:GB|MB))-(\d+)-days?$/;

/**
 * All the `Offer`s on one of their pages, from its schema.org blocks. The same
 * offer appears in more than one block; each is returned once, by its URL.
 */
export function offersInPage(html: string): ZensimOffer[] {
  const offers = new Map<string, ZensimOffer>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (record['@type'] === 'Offer' && typeof record.url === 'string') offers.set(record.url, record as ZensimOffer);
    Object.values(record).forEach(walk);
  };
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      walk(JSON.parse(match[1]));
    } catch {
      // A block that is not JSON holds no offer we can read.
    }
  }
  return [...offers.values()];
}

/**
 * One offer onto the site's plan shape. Only what the offer states: country,
 * data, days and list price come from its id and price. Networks, speeds,
 * hotspot and an unlimited plan's fair-use terms are not in it, so they are
 * left unstated rather than filled in.
 *
 * The link is the offer's own URL with our affiliate id. It opens the
 * country's page on the plan's duration, with this plan among the three or
 * four on screen — not on the plan itself. The owner accepted that for ZenSim
 * only, on 29 September 2026 ("if the links bring me to where I can choose the
 * right plan for the region and the number of days, that's great"), because
 * ZenSim have no plan-level link; see `buyLinkLandsOnPlan`.
 */
export function mapZensimOffer(offer: ZensimOffer, affiliateId: string, fetchedAt: string): MappedZensimOffer {
  const url = typeof offer.url === 'string' ? offer.url : '';
  const label = typeof offer.name === 'string' ? offer.name : url;
  let parsed: URL | null = null;
  try {
    parsed = new URL(url);
  } catch {
    parsed = null;
  }
  const planId = parsed?.searchParams.get('id') ?? '';
  const skip = (reason: SkippedRecord['reason'], detail: string): MappedZensimOffer => ({
    skipped: { externalId: planId || url, label, reason, detail },
  });

  if (!parsed || parsed.hostname !== 'zensim.com' || !parsed.pathname.startsWith('/travel-esims/')) {
    return skip('unknown-provider', `url "${url}"`);
  }
  const match = PLAN_ID.exec(planId);
  if (!match) return skip('unknown-destination', `id "${planId}"`);
  const [, idCurrency, countryCode, allowance, daysText] = match;

  if (!getCountryByCode(countryCode)) return skip('unknown-destination', `country "${countryCode}"`);

  const unlimited = allowance === 'UNLIMITED';
  const amount = unlimited ? 0 : Number.parseFloat(allowance);
  const megabytes = unlimited ? 0 : allowance.endsWith('GB') ? Math.round(amount * MB_PER_GB) : Math.round(amount);
  if (!unlimited && !(megabytes > 0)) return skip('unparsable-allowance', `allowance "${allowance}"`);

  const days = Number(daysText);
  if (!(Number.isInteger(days) && days > 0)) return skip('unparsable-validity', `days "${daysText}"`);
  // The duration in the link is what their page opens on; it must be the plan's.
  if (parsed.searchParams.get('duration') !== daysText) {
    return skip('unparsable-validity', `duration "${parsed.searchParams.get('duration')}" in the link, ${days} in the id`);
  }

  const currency = typeof offer.priceCurrency === 'string' ? offer.priceCurrency.toUpperCase() : '';
  if (currency !== 'USD' || idCurrency !== 'USD') return skip('unsupported-currency', `currency "${currency}", id ${idCurrency}`);
  const price = Number(typeof offer.price === 'string' || typeof offer.price === 'number' ? offer.price : NaN);
  if (!(Number.isFinite(price) && price > 0)) return skip('missing-price', `price ${JSON.stringify(offer.price)}`);
  const priceMinor = Math.round(price * 100);

  const link = new URL(parsed);
  link.searchParams.set('via', affiliateId);
  const country = getCountryByCode(countryCode)!;
  const allowanceLabel = unlimited ? 'Unlimited' : allowance;

  return {
    plan: {
      id: `zensim-${planId}`,
      providerId: ZENSIM_PROVIDER_ID,
      planName: `${country.names.en} ${allowanceLabel} ${days} ${days === 1 ? 'Day' : 'Days'}`,
      coverage: { kind: 'country', countries: [countryCode], regionId: null, publishedDestinationCount: null },
      dataAmountMb: megabytes,
      isUnlimited: unlimited,
      // ZenSim have a fair use policy for unlimited plans; its terms are not in
      // the offer. A cap exists, what it is is not stated.
      fairUsage: unlimited ? { thresholdMb: null, per: null, throttledToKbps: null } : null,
      validityDays: days,
      sourceCurrency: 'USD',
      originalPriceMinor: priceMinor,
      finalPriceMinor: priceMinor,
      discount: null,
      localPricesMinor: {},
      networks: [],
      hotspot: null,
      calls: null,
      sms: null,
      topUp: null,
      affiliateUrl: link.toString(),
      affiliateLandsOn: 'duration',
      source: 'api',
      lastUpdatedAt: fetchedAt,
    },
  };
}
