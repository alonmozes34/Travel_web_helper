import { ALOSIM_OFFER_ID } from '@/data/alosim';
import { alosimDestinations } from '@/data/alosim.generated';
import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapAlosimPlan } from './mapPlan';
import type { AlosimCredentials, AlosimPage, AlosimPlan } from './types';

export const ALOSIM_API_BASE = 'https://api.alosim.com';

/**
 * Their prices do not move by the minute, and each refresh is a dozen calls to
 * someone else's server. aloSIM have not published a rate limit; a few hours
 * is gentle and still same-day fresh, and every price carries the time it was
 * fetched.
 */
const REFRESH_MS = 3 * 60 * 60 * 1000;
const PAGE_SIZE = 200;
const PARALLEL_PAGES = 4;

export type AlosimFetch = (url: string, init: { method: 'GET' | 'POST'; headers: Record<string, string>; body?: string }) => Promise<unknown>;

/** The credentials from the environment, or null when they are not set. */
export function alosimCredentialsFromEnv(env: Record<string, string | undefined> = process.env): AlosimCredentials | null {
  const clientId = env.ALOSIM_CLIENT_ID?.trim();
  const clientSecret = env.ALOSIM_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/**
 * aloSIM's Store API as a plan source.
 *
 * aloSIM gave written permission to display these prices on the site (Adam
 * Bednarek, partnerships, by email, September 2026), and on 25 September 2026
 * fifteen of their prices were checked by hand against their own store and
 * matched to the cent — these are the prices a traveller pays, not a trade
 * price.
 *
 * Only documented endpoints: POST /v1/authorize for a bearer token, then
 * GET /v1/plans, page by page. Nothing is read from their website.
 */
export function alosimSource({
  credentials,
  fetchJson = defaultFetchJson,
  now = () => Date.now(),
}: {
  credentials: AlosimCredentials;
  fetchJson?: AlosimFetch;
  now?: () => number;
}): ProviderSource {
  const catalogue = cached<SourceResult>({
    load: () => loadCatalogue(credentials, fetchJson, new Date(now()).toISOString()),
    ttlMs: REFRESH_MS,
    now,
  });

  return {
    id: 'alosim',
    label: 'aloSIM Store API',
    async fetch() {
      return (await catalogue.get()).value;
    },
  };
}

async function loadCatalogue(credentials: AlosimCredentials, fetchJson: AlosimFetch, fetchedAt: string): Promise<SourceResult> {
  const auth = (await fetchJson(`${ALOSIM_API_BASE}/v1/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: credentials.clientId, clientSecret: credentials.clientSecret }),
  })) as { access_token?: string; token_type?: string };
  if (!auth.access_token) throw new Error('aloSIM authorize returned no token');
  const headers = { Authorization: `${auth.token_type ?? 'Bearer'} ${auth.access_token}` };

  const page = (offset: number) =>
    fetchJson(`${ALOSIM_API_BASE}/v1/plans?currency=USD&offset=${offset}&count=${PAGE_SIZE}`, {
      method: 'GET',
      headers,
    }) as Promise<AlosimPage>;

  const first = await page(0);
  const items: AlosimPlan[] = [...(first.items ?? [])];
  const offsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < (first.total ?? 0); offset += PAGE_SIZE) offsets.push(offset);
  for (let i = 0; i < offsets.length; i += PARALLEL_PAGES) {
    const batch = await Promise.all(offsets.slice(i, i + PARALLEL_PAGES).map(page));
    for (const result of batch) items.push(...(result.items ?? []));
  }
  // A short read is a failed refresh, not a smaller catalogue: throwing keeps
  // the last complete one on the page instead of silently dropping plans.
  if (first.total && items.length < first.total) {
    throw new Error(`aloSIM returned ${items.length} of ${first.total} plans`);
  }

  const plans: Plan[] = [];
  const skipped: SkippedRecord[] = [];
  for (const item of items) {
    const mapped = mapAlosimPlan(item, fetchedAt, alosimLinkFor);
    if ('plan' in mapped) plans.push(mapped.plan);
    else skipped.push(mapped.skipped);
  }
  return sourceResult('alosim', plans, skipped, fetchedAt);
}

const trackingBySlug = new Map(alosimDestinations.map((destination) => [destination.slug, destination]));
const trackingByCountry = new Map(
  alosimDestinations
    .filter((destination) => destination.countryCode)
    .map((destination) => [destination.countryCode as string, destination]),
);

/**
 * Where "buy" sends a traveller for an aloSIM plan.
 *
 * The Everflow tracking link for the plan's page comes first, because aloSIM
 * confirmed that is how a sale is credited. The API also gives each plan a
 * deep link carrying our affiliate and offer ids; whether a sale through it
 * is credited the same way is still being confirmed with aloSIM, so it is used
 * only for pages that have no tracking link of their own.
 *
 * `source_id` is the one custom parameter aloSIM's links support. It carries
 * the destination, so their reports show which destinations sell.
 */
export function alosimLinkFor(item: AlosimPlan, countryCodes: string[]): string | null {
  const slug = pageSlug(item.url);
  const single = countryCodes.length === 1 && item.locations.length === 1 ? countryCodes[0] : null;
  const destination = (slug ? trackingBySlug.get(slug) : undefined) ?? (single ? trackingByCountry.get(single) : undefined);
  const base = destination?.links[ALOSIM_OFFER_ID] ?? item.url;
  const tag = single ?? slug;
  return tag ? withParam(base, 'source_id', tag) : base;
}

function pageSlug(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, '') || null;
  } catch {
    return null;
  }
}

function withParam(url: string, key: string, value: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return url;
  }
}

async function defaultFetchJson(url: string, init: Parameters<AlosimFetch>[1]): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    // Our own cache above decides when to refresh; Next's must not hold a
    // second, differently-timed copy.
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`aloSIM ${init.method} ${new URL(url).pathname} → HTTP ${response.status}`);
  return response.json();
}
