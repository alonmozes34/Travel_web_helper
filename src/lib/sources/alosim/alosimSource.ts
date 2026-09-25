import { ALOSIM_OFFER_ID } from '@/data/alosim';
import type { Locale } from '@/i18n/config';
import { alosimDestinations, alosimPageLinks } from '@/data/alosim.generated';
import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapAlosimPlan } from './mapPlan';
import type { AlosimCredentials, AlosimLink, AlosimPage, AlosimPlan } from './types';

export const ALOSIM_API_BASE = 'https://api.alosim.com';

/**
 * Their prices do not move by the minute, and each refresh is a dozen calls to
 * someone else's server. aloSIM have not published a rate limit; a few hours
 * is gentle and still same-day fresh, and every price carries the time it was
 * fetched.
 */
const REFRESH_MS = 3 * 60 * 60 * 1000;
/**
 * The whole catalogue fits in one page: 2,148 plans came back from a single
 * request in 1.6 seconds, where pages of 200 took eleven requests and 5.6.
 * Paging stays, in case the catalogue outgrows it.
 */
const PAGE_SIZE = 2500;

/**
 * Asked for by name. The API localises by `Accept-Language`, and Node's fetch
 * sends `*` when nothing is set — which the API put into every plan link as a
 * path segment: "alosim.com/" then "*" then "/japan-esim". Those links matched
 * none of the tracking pages aloSIM issued, so every button fell back to the
 * store app, and plans with no tracking page at all got a link to a page that
 * does not exist. Found on 25 September 2026, when a check with curl (which
 * sends no such header) disagreed with the running site.
 */
const API_LANGUAGE = 'en';

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
    // After the first load, a visitor never waits on aloSIM: the last
    // catalogue is served while the next one is fetched.
    staleWhileRevalidate: true,
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
    headers: { 'Content-Type': 'application/json', 'Accept-Language': API_LANGUAGE },
    body: JSON.stringify({ clientId: credentials.clientId, clientSecret: credentials.clientSecret }),
  })) as { access_token?: string; token_type?: string };
  if (!auth.access_token) throw new Error('aloSIM authorize returned no token');
  const headers = {
    Authorization: `${auth.token_type ?? 'Bearer'} ${auth.access_token}`,
    'Accept-Language': API_LANGUAGE,
  };

  const page = (offset: number) =>
    fetchJson(`${ALOSIM_API_BASE}/v1/plans?currency=USD&offset=${offset}&count=${PAGE_SIZE}`, {
      method: 'GET',
      headers,
    }) as Promise<AlosimPage>;

  const first = await page(0);
  const items: AlosimPlan[] = [...(first.items ?? [])];
  const offsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < (first.total ?? 0); offset += PAGE_SIZE) offsets.push(offset);
  for (const result of await Promise.all(offsets.map(page))) items.push(...(result.items ?? []));
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
 * Send every "buy" to aloSIM's own page for the exact plan, in the visitor's
 * language — the per-plan link their Store API issues, with our affiliate and
 * offer ids in it, and its Hebrew twin (the same page under /he/, which the
 * API itself returns when asked for Hebrew; checked for all 2,148 plans on 25
 * September 2026, same page and same price).
 *
  * This is what the owner asked for: one click, onto the plan the visitor
 * chose, in a language they read — no page of other plans to wander through
 * and change their mind on.
 *
 * On since 25 September 2026, when a test click through such a link
 * (alosim.com/japan-esim?plan_id=…&affid=1810&oid=9&source_id=linktest) showed
 * up in our Everflow reports under the $5 offer, with a transaction id — the
 * id a purchase is attributed to — and the parameters plan_id, affid, oid
 * and source_id read from the page. Everflow's script on aloSIM's site takes
 * the ids from the link itself; the registered tracking pages are not needed.
 * Turning it off falls back to the registered pages; both settings are tested.
 */
export const LINK_TO_PLAN = true;

/** Languages our site speaks that aloSIM also has pages in, and their path segment. */
const ALOSIM_LANGUAGES: Partial<Record<Locale, string>> = { he: 'he' };

/**
 * Where "buy" sends a traveller for an aloSIM plan.
 *
 * With `LINK_TO_PLAN` on: aloSIM's own per-plan link, localised (above).
 *
 * With it off, the links aloSIM registered for us, in order of preference:
 *
 *  1. **The tracking link for the plan's page on their main site, with the
 *     plan's `plan_id` added**, so the page opens on the plan. English only:
 *     those are the pages registered. About five plans in six.
 *  2. **Their store app's tracking link for the destination**, which lands on
 *     the destination rather than the plan, and lists fewer plans than the
 *     main site (six for Japan against thirty-two). The button then says
 *     what to pick. Only where (1) does not exist.
 *  3. **aloSIM's own per-plan link**, where neither exists.
 *
 * `source_id` is the one custom parameter aloSIM's links support. It carries
 * the destination, so their reports show which destinations sell.
 */
export function alosimLinkFor(
  item: AlosimPlan,
  countryCodes: string[],
  { toPlan = LINK_TO_PLAN }: { toPlan?: boolean } = {},
): AlosimLink | null {
  const slug = pageSlug(item.url);
  const single = countryCodes.length === 1 && item.locations.length === 1 ? countryCodes[0] : null;
  const tag = single ?? slug;
  const tagged = (url: string) => (tag ? withParam(url, 'source_id', tag) : url);

  const ownPlanLink = (): AlosimLink => {
    const byLocale: Partial<Record<Locale, string>> = {};
    for (const [locale, segment] of Object.entries(ALOSIM_LANGUAGES) as Array<[Locale, string]>) {
      const localised = inLanguage(item.url, segment);
      if (localised) byLocale[locale] = tagged(localised);
    }
    return { href: tagged(item.url), landsOn: 'plan', byLocale };
  };

  if (toPlan) return ownPlanLink();

  const planId = planIdOf(item.url);
  const sitePage = slug ? alosimPageLinks[slug]?.[ALOSIM_OFFER_ID] : undefined;
  if (sitePage && planId) {
    return { href: tagged(withParam(sitePage, 'plan_id', planId)), landsOn: 'plan' };
  }

  const destination = (slug ? trackingBySlug.get(slug) : undefined) ?? (single ? trackingByCountry.get(single) : undefined);
  if (destination) return { href: tagged(destination.links[ALOSIM_OFFER_ID]), landsOn: 'destination' };

  return ownPlanLink();
}

/** alosim.com/japan-esim → alosim.com/he/japan-esim, the form their API returns for Hebrew. */
function inLanguage(url: string, segment: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'alosim.com') return null;
    parsed.pathname = `/${segment}${parsed.pathname}`;
    return parsed.toString();
  } catch {
    return null;
  }
}

function planIdOf(url: string): string | null {
  try {
    return new URL(url).searchParams.get('plan_id');
  } catch {
    return null;
  }
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
