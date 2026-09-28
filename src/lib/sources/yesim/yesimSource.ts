import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapYesimPlan } from './mapPlan';
import type { YesimPlan } from './types';

export const YESIM_API_BASE = 'https://api.yesim.app/api_v0.1/api';

/**
 * The same pace as aloSIM: Yesim publish no rate limit, the whole catalogue
 * is one 1.7MB response, and every price carries the time it was fetched.
 */
const REFRESH_MS = 3 * 60 * 60 * 1000;

/**
 * Fewer than this and the response is taken as a failed read, not a smaller
 * catalogue — the last complete one stays on the page. 3,617 plans came back
 * on 28 September 2026.
 */
const MIN_PLANS = 1000;

export type YesimFetch = (url: string) => Promise<unknown>;

/**
 * Our Yesim partner id from the environment, or null when it is not set.
 *
 * It is not a secret — it is in every link we send a traveller along — but it
 * lives in the environment like aloSIM's credentials so that whether Yesim is
 * on the site is decided in one place, per deployment, and a test run never
 * reaches their server by accident.
 */
export function yesimPartnerIdFromEnv(env: Record<string, string | undefined> = process.env): string | null {
  const id = env.YESIM_PARTNER_ID?.trim();
  return id && /^\d+$/.test(id) ? id : null;
}

/**
 * Yesim's Prices API as a plan source.
 *
 * The endpoint is the one Yesim document for affiliates in their partner
 * dashboard (Integrations → "Yesim Prices API"), with our partner id as
 * `partner`; it needs no key. Each record carries the link to its
 * destination's page with our partner id already in it. Nothing is read from
 * their website.
 */
export function yesimSource({
  partnerId,
  fetchJson = defaultFetchJson,
  now = () => Date.now(),
}: {
  partnerId: string;
  fetchJson?: YesimFetch;
  now?: () => number;
}): ProviderSource {
  const catalogue = cached<SourceResult>({
    load: () => loadCatalogue(partnerId, fetchJson, new Date(now()).toISOString()),
    ttlMs: REFRESH_MS,
    now,
    staleWhileRevalidate: true,
  });

  return {
    id: 'yesim',
    label: 'Yesim Prices API',
    async fetch() {
      return (await catalogue.get()).value;
    },
  };
}

async function loadCatalogue(partnerId: string, fetchJson: YesimFetch, fetchedAt: string): Promise<SourceResult> {
  const items = await fetchJson(`${YESIM_API_BASE}/prices?partner=${encodeURIComponent(partnerId)}`);
  if (!Array.isArray(items)) throw new Error('Yesim prices: response is not a list');
  if (items.length < MIN_PLANS) throw new Error(`Yesim prices: only ${items.length} plans`);

  const plans: Plan[] = [];
  const skipped: SkippedRecord[] = [];
  for (const item of items as YesimPlan[]) {
    const mapped = mapYesimPlan(item, fetchedAt);
    if ('plan' in mapped) plans.push(mapped.plan);
    else skipped.push(mapped.skipped);
  }
  return sourceResult('yesim', plans, skipped, fetchedAt);
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Yesim GET ${new URL(url).pathname} → HTTP ${response.status}`);
  return response.json();
}
