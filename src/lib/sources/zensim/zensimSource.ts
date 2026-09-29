import { after } from 'next/server';
import { cached } from '@/lib/catalogue/cache';
import type { Plan } from '@/lib/types/plan';
import { sourceResult, type ProviderSource, type SkippedRecord, type SourceResult } from '../ProviderSource';
import { mapZensimOffer, offersInPage } from './mapOffer';

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
 *  - four pages at a time, every six hours.
 *
 * Their private GraphQL backend, which their own site calls, is not used.
 */
const REFRESH_MS = 6 * 60 * 60 * 1000;
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
}: {
  affiliateId: string;
  fetchText?: ZensimFetchText;
  now?: () => number;
  firstLoadWaitMs?: number;
  /** For tests with a small fixture; the defaults are the real catalogue's floor. */
  minPlans?: number;
  minPages?: number;
}): ProviderSource {
  const catalogue = cached<SourceResult>({
    load: () => loadCatalogue(affiliateId, fetchText, new Date(now()).toISOString(), { minPlans, minPages }),
    ttlMs: REFRESH_MS,
    now,
    staleWhileRevalidate: true,
  });
  let loaded = false;

  return {
    id: 'zensim',
    label: 'ZenSim country pages (schema.org data)',
    async fetch() {
      if (loaded) return (await catalogue.get()).value;
      // The first read takes 20–40 seconds. Nobody waits for it: the page
      // goes out without ZenSim, and the read finishes after the response.
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

async function loadCatalogue(
  affiliateId: string,
  fetchText: ZensimFetchText,
  fetchedAt: string,
  { minPlans, minPages }: { minPlans: number; minPages: number },
): Promise<SourceResult> {
  const sitemap = await fetchText(`${ZENSIM_SITE}/sitemap.xml`);
  const pages = [
    ...new Set(
      [...sitemap.matchAll(/<loc>(https:\/\/zensim\.com\/travel-esims\/([a-z0-9-]+)\/)<\/loc>/g)]
        .filter((match) => !NOT_A_COUNTRY.has(match[2]))
        .map((match) => match[1]),
    ),
  ];
  if (pages.length < minPages) throw new Error(`ZenSim sitemap: only ${pages.length} country pages`);

  const plans = new Map<string, Plan>();
  const skipped: SkippedRecord[] = [];
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
        const mapped = mapZensimOffer(offer, affiliateId, fetchedAt);
        if ('plan' in mapped) plans.set(mapped.plan.id, mapped.plan);
        else skipped.push(mapped.skipped);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // A partial read is a failed refresh: the last complete catalogue stays.
  if (failedPages > pages.length * 0.05) throw new Error(`ZenSim: ${failedPages} of ${pages.length} pages could not be read`);
  if (plans.size < minPlans) throw new Error(`ZenSim: only ${plans.size} plans from ${pages.length} pages`);
  return sourceResult('zensim', [...plans.values()], skipped, fetchedAt);
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
