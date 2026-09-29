import { unstable_cache } from 'next/cache';
import { after } from 'next/server';
import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapZensimOffer, offersInPage, type ZensimOffer } from './mapOffer';

export const ZENSIM_SITE = 'https://zensim.com';

/**
 * ZenSim publish no price feed. The owner allowed reading the prices from
 * their own pages, for ZenSim only, on 29 September 2026 — the one exception
 * to "nothing is read from a provider's website" (CLAUDE.md). So this reads
 * as little as possible, as rarely as is reasonable:
 *
 *  - the list of country pages from their sitemap, one request;
 *  - on each country page, only the schema.org data they publish for search
 *    engines, which sits in the first ~140KB of a ~650KB page — the read
 *    stops there;
 *  - four pages at a time, every six hours — once for the whole site, not
 *    once per server: the offers read are kept in the host's shared cache
 *    (`unstable_cache`, Vercel's data cache), so a server that starts has
 *    them at once. Without that, every new server read all 189 pages again
 *    and its first minute of visitors saw no ZenSim (29 September 2026).
 *
 * Their private GraphQL backend, which their own site calls, is not used.
 */
const REFRESH_S = 6 * 60 * 60;
/** How often a server looks at the shared copy again. The read itself happens at most every REFRESH_S. */
const LOCAL_TTL_MS = 10 * 60 * 1000;
const CONCURRENCY = 4;
/** Enough to hold every schema.org block on the pages read on 29 September 2026 (the last ended at 138KB). */
const READ_LIMIT_BYTES = 300 * 1024;
/** Regional and utility pages under /travel-esims/: their plans' countries are not in the data. */
const NOT_A_COUNTRY = new Set([
  'asia', 'caribbean', 'europe', 'latin-america', 'oceania', 'middle-east', 'the-balkans', 'global',
  'north-america', 'south-america', 'search',
]);
/**
 * Fewer than this and the read is taken as a failure, not a smaller
 * catalogue: the last complete one stays on the page. 2,113 plans on 29
 * September 2026.
 */
const MIN_PLANS = 1000;
/** 189 country pages on 29 September 2026. */
const MIN_PAGES = 100;
/** How long the first visitor on a fresh server waits for ZenSim before the page goes out without it. */
const FIRST_LOAD_WAIT_MS = 3000;

const USER_AGENT = 'Mozilla/5.0 (compatible; yeshklita/1.0; +https://www.yeshklita.com)';

export type ZensimFetchText = (url: string, limitBytes?: number) => Promise<string>;

/** What is kept in the shared cache: the offers as read, and when. Small — about 350KB. */
export type ZensimSnapshot = {
  fetchedAt: string;
  offers: Array<Pick<ZensimOffer, 'url' | 'price' | 'priceCurrency'>>;
};

/** Keeps `load`'s result for the whole deployment. Injected in tests, where there is no host cache. */
export type ZensimPersist = (load: () => Promise<ZensimSnapshot>) => () => Promise<ZensimSnapshot>;

/**
 * Our ZenSim affiliate id (their `?via=`) from the environment, or null when
 * it is not set — which keeps ZenSim off a deployment, and off every test run.
 */
export function zensimAffiliateIdFromEnv(env: Record<string, string | undefined> = process.env): string | null {
  const id = env.ZENSIM_AFFILIATE_ID?.trim();
  return id && /^[a-z0-9_-]+$/i.test(id) ? id : null;
}

export function zensimSource({
  affiliateId,
  fetchText = defaultFetchText,
  now = () => Date.now(),
  firstLoadWaitMs = FIRST_LOAD_WAIT_MS,
  minPlans = MIN_PLANS,
  minPages = MIN_PAGES,
  persist = sharedAcrossServers,
}: {
  affiliateId: string;
  fetchText?: ZensimFetchText;
  now?: () => number;
  firstLoadWaitMs?: number;
  /** For tests with a small fixture; the defaults are the real catalogue's floor. */
  minPlans?: number;
  minPages?: number;
  persist?: ZensimPersist;
}): ProviderSource {
  const snapshot = persist(() => readOffers(fetchText, new Date(now()).toISOString(), { minPlans, minPages }));
  const catalogue = cached<SourceResult>({
    load: async () => toResult(await snapshot(), affiliateId),
    ttlMs: LOCAL_TTL_MS,
    now,
    staleWhileRevalidate: true,
  });
  let loaded = false;

  return {
    id: 'zensim',
    label: 'ZenSim country pages (schema.org data)',
    async fetch() {
      if (loaded) return (await catalogue.get()).value;
      // From the shared cache this takes a moment. Only the very first read
      // of all — 20–40 seconds — is not waited for: the page goes out without
      // ZenSim, and the read finishes after the response.
      const first = catalogue.get().then((state) => {
        loaded = true;
        return state;
      });
      keepAliveUntil(first);
      const winner = await Promise.race([
        first,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), firstLoadWaitMs)),
      ]);
      if (winner === null) throw new Error('ZenSim catalogue is still loading');
      return winner.value;
    },
  };
}

/** Ask the host to keep the server running until `work` ends. Outside a request (tests, scripts) there is nothing to ask. */
function keepAliveUntil(work: Promise<unknown>) {
  try {
    after(() => work.catch(() => {}));
  } catch {
    work.catch(() => {});
  }
}

/** The host's shared cache, or — outside a Next server (tests, scripts), where there is none — the read itself. */
function sharedAcrossServers(load: () => Promise<ZensimSnapshot>): () => Promise<ZensimSnapshot> {
  const shared = unstable_cache(load, ['zensim-offers-v1'], { revalidate: REFRESH_S });
  return async () => {
    try {
      return await shared();
    } catch (error) {
      if (error instanceof Error && error.message.includes('incrementalCache missing')) return load();
      throw error;
    }
  };
}

/**
 * Every country page's offers. Throws rather than return a thin read, so the
 * shared cache keeps the last complete one.
 */
async function readOffers(
  fetchText: ZensimFetchText,
  fetchedAt: string,
  { minPlans, minPages }: { minPlans: number; minPages: number },
): Promise<ZensimSnapshot> {
  const sitemap = await fetchText(`${ZENSIM_SITE}/sitemap.xml`);
  const pages = [
    ...new Set(
      [...sitemap.matchAll(/<loc>(https:\/\/zensim\.com\/travel-esims\/([a-z0-9-]+)\/)<\/loc>/g)]
        .filter((match) => !NOT_A_COUNTRY.has(match[2]))
        .map((match) => match[1]),
    ),
  ];
  if (pages.length < minPages) throw new Error(`ZenSim sitemap: only ${pages.length} country pages`);

  const offers = new Map<string, ZensimSnapshot['offers'][number]>();
  let failedPages = 0;
  let next = 0;
  const worker = async () => {
    while (next < pages.length) {
      const page = pages[next++];
      let html: string;
      try {
        html = await fetchText(page, READ_LIMIT_BYTES);
      } catch {
        failedPages += 1;
        continue;
      }
      for (const offer of offersInPage(html)) {
        offers.set(String(offer.url), { url: offer.url, price: offer.price, priceCurrency: offer.priceCurrency });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (failedPages > pages.length * 0.05) throw new Error(`ZenSim: ${failedPages} of ${pages.length} pages could not be read`);
  const snapshot = { fetchedAt, offers: [...offers.values()] };
  const usable = toResult(snapshot, 'check').plans.length;
  if (usable < minPlans) throw new Error(`ZenSim: only ${usable} plans from ${pages.length} pages`);
  return snapshot;
}

function toResult(snapshot: ZensimSnapshot, affiliateId: string): SourceResult {
  const plans = new Map<string, Plan>();
  const skipped: SkippedRecord[] = [];
  for (const offer of snapshot.offers) {
    const mapped = mapZensimOffer(offer, affiliateId, snapshot.fetchedAt);
    if ('plan' in mapped) plans.set(mapped.plan.id, mapped.plan);
    else skipped.push(mapped.skipped);
  }
  return sourceResult('zensim', [...plans.values()], skipped, snapshot.fetchedAt);
}

/** GET, reading at most `limitBytes` of the body. */
async function defaultFetchText(url: string, limitBytes?: number): Promise<string> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.body) throw new Error(`ZenSim GET ${new URL(url).pathname} → HTTP ${response.status}`);
  if (!limitBytes) return response.text();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (bytes < limitBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return text;
}
