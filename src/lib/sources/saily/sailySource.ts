import { sailyOffered } from '@/data/saily-offered.generated';
import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapSailyPlan } from './mapPlan';
import type { SailyPlan } from './types';

/**
 * Saily's partner API, which they sent on 9 October 2026: "add
 * utm_source=yeshklita" to read it "without any restrictions". No key.
 */
export const SAILY_API = 'https://web.saily.com/v3/partners/plans?utm_source=yeshklita';

/** The same pace as Yesim's: one ~1.3MB response, no published rate limit. */
const REFRESH_MS = 3 * 60 * 60 * 1000;

/**
 * Fewer than this and the response is taken as a failed read, not a smaller
 * catalogue — the last complete one stays on the page. 1,184 plans came back
 * on 9 October 2026.
 */
const MIN_PLANS = 1000;

export type SailyFetchJson = (url: string) => Promise<unknown>;

/**
 * Our Saily affiliate id (their TUNE `aff_id`) from the environment, or null
 * when it is not set — which keeps Saily off a deployment, and off every test
 * run. Not a secret: it is in every link we send a traveller along.
 */
export function sailyAffiliateIdFromEnv(env: Record<string, string | undefined> = process.env): string | null {
  const id = env.SAILY_AFFILIATE_ID?.trim();
  return id && /^\d+$/.test(id) ? id : null;
}

/**
 * Saily's partner API as a plan source. Prices and plans come from the API
 * only. Which of its plans saily.com actually sells, and at what price, is
 * the list `scripts/check-saily-pages.ts` writes (`offered`); a plan not on
 * it at the API's price stays off the site (`mapSailyPlan`).
 */
export function sailySource({
  affiliateId,
  fetchJson = defaultFetchJson,
  offered = new Map(Object.entries(sailyOffered)),
  now = () => Date.now(),
  minPlans = MIN_PLANS,
}: {
  affiliateId: string;
  fetchJson?: SailyFetchJson;
  offered?: ReadonlyMap<string, number>;
  now?: () => number;
  /** For tests with a small fixture; the default is the real catalogue's floor. */
  minPlans?: number;
}): ProviderSource {
  const catalogue = cached<SourceResult>({
    load: () => loadCatalogue(affiliateId, fetchJson, offered, new Date(now()).toISOString(), minPlans),
    ttlMs: REFRESH_MS,
    now,
    staleWhileRevalidate: true,
  });

  return {
    id: 'saily',
    label: 'Saily partner API',
    async fetch() {
      return (await catalogue.get()).value;
    },
  };
}

async function loadCatalogue(
  affiliateId: string,
  fetchJson: SailyFetchJson,
  offered: ReadonlyMap<string, number>,
  fetchedAt: string,
  minPlans: number,
): Promise<SourceResult> {
  const body = await fetchJson(SAILY_API);
  const items = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) throw new Error('Saily plans: response has no list of items');
  if (items.length < minPlans) throw new Error(`Saily plans: only ${items.length}`);

  const plans: Plan[] = [];
  const skipped: SkippedRecord[] = [];
  for (const item of items as SailyPlan[]) {
    const mapped = mapSailyPlan(item, { affiliateId, fetchedAt, offered });
    if ('plan' in mapped) plans.push(mapped.plan);
    else skipped.push(mapped.skipped);
  }
  return sourceResult('saily', plans, skipped, fetchedAt);
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Saily GET ${new URL(url).pathname} → HTTP ${response.status}`);
  return response.json();
}
