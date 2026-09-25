import { promotions as confirmedPromotions, type Promotion } from '@/data/promotions';
import type { FxRate } from '@/lib/pricing/convert';
import { applyPromotions } from '@/lib/pricing/promotions';
import type { Plan } from '@/lib/types/plan';
import { mergeResults, type ProviderSource, type SkippedRecord } from '@/lib/sources/ProviderSource';
import type { RateSource } from '@/lib/sources/RateSource';
import { ecbRateSource } from '@/lib/sources/ecb/ecbRateSource';
import { alosimCredentialsFromEnv, alosimSource } from '@/lib/sources/alosim/alosimSource';
import { mockPlanSource, mockRateSource } from '@/lib/sources/mockPlanSource';
import { cached } from './cache';

/**
 * Everything the comparison needs, from wherever it currently comes from.
 *
 * One place resolves the sources, so the pages ask for a catalogue and know
 * nothing about who supplied it. `buildComparison` stays pure — it is the
 * scoring engine and has no business doing IO — and takes what this returns.
 */
export type Catalogue = {
  plans: Plan[];
  rates: FxRate[];
  /** Per source, so a silent degradation is visible rather than merely quieter. */
  sources: SourceStatus[];
  /** Records a source refused to map, with the reason. */
  skipped: SkippedRecord[];
  /** Two sources claiming the same plan id. Should be empty. */
  collisions: string[];
  fetchedAt: string;
};

export type SourceStatus = {
  id: string;
  label: string;
  ok: boolean;
  planCount: number;
  error: string | null;
};

/** A minute is short enough to notice a price change, long enough to be a cache. */
const PLAN_TTL_MS = 60 * 1000;
/** The ECB publishes once per business day; asking more often than hourly is noise. */
const RATE_TTL_MS = 60 * 60 * 1000;

export type CatalogueSources = { plans: ProviderSource[]; rates: RateSource[] };

/**
 * The sources in play.
 *
 * Plans come from every provider whose credentials are configured — aloSIM
 * today. The demo catalogue is never mixed in with them: a real price beside
 * an invented one tells a traveller nothing, and a search engine would index
 * the invented one as an offer. It runs only where it is asked for by name
 * (`DEMO_CATALOGUE=true`), for development and the test suites, and only when
 * no real provider is configured. With neither, the catalogue is empty and
 * every page says it has nothing yet.
 *
 * Rates are real: the ECB feed needs no key, so the fallback set exists only
 * for when the feed cannot be reached, and every rate carries which of the
 * two it came from all the way to the page.
 */
export function planSourcesFromEnv(env: Record<string, string | undefined> = process.env): ProviderSource[] {
  const alosim = alosimCredentialsFromEnv(env);
  const real = alosim ? [alosimSource({ credentials: alosim })] : [];
  if (real.length > 0) return real;
  return env.DEMO_CATALOGUE === 'true' ? [mockPlanSource()] : [];
}

export function defaultSources(): CatalogueSources {
  return { plans: planSourcesFromEnv(), rates: [ecbRateSource(), mockRateSource()] };
}

/**
 * Rates are tried in order and the first complete set wins.
 *
 * Never a mixture: a page showing one currency converted at today's rate and
 * another at a fallback would be wrong in a way nobody could see.
 */
async function loadRates(sources: RateSource[]): Promise<{ rates: FxRate[]; status: SourceStatus[] }> {
  const status: SourceStatus[] = [];
  for (const source of sources) {
    try {
      const result = await source.fetch();
      status.push({ id: source.id, label: source.label, ok: true, planCount: result.rates.length, error: null });
      return { rates: result.rates, status };
    } catch (error) {
      status.push({
        id: source.id,
        label: source.label,
        ok: false,
        planCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw new Error('every rate source failed');
}

/**
 * Plan sources all contribute, and one failing does not take the others with
 * it — a catalogue missing one provider is still a comparison, and the gap is
 * reported rather than hidden.
 */
async function loadPlans(sources: ProviderSource[]) {
  const status: SourceStatus[] = [];
  const results = [];
  for (const source of sources) {
    try {
      const result = await source.fetch();
      results.push(result);
      status.push({ id: source.id, label: source.label, ok: true, planCount: result.plans.length, error: null });
    } catch (error) {
      status.push({
        id: source.id,
        label: source.label,
        ok: false,
        planCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { merged: mergeResults(results), status };
}

export function catalogueLoader(
  sources: CatalogueSources = defaultSources(),
  now = () => Date.now(),
  promotions: readonly Promotion[] = confirmedPromotions,
) {
  const plans = cached({ load: () => loadPlans(sources.plans), ttlMs: PLAN_TTL_MS, now });
  const rates = cached({ load: () => loadRates(sources.rates), ttlMs: RATE_TTL_MS, now });

  return {
    async get(): Promise<Catalogue> {
      const [p, r] = await Promise.all([plans.get(), rates.get()]);
      return {
        // Applied on every read rather than when the plans were fetched, so a
        // code stops the day it expires even if the cache is older than that.
        plans: applyPromotions(p.value.merged.plans, promotions, new Date(now()).toISOString().slice(0, 10)),
        rates: r.value.rates,
        sources: [...p.value.status, ...r.value.status],
        skipped: p.value.merged.skipped,
        collisions: p.value.merged.collisions,
        fetchedAt: new Date(Math.min(p.storedAt, r.storedAt)).toISOString(),
      };
    },
    clear() {
      plans.clear();
      rates.clear();
    },
  };
}

const defaultLoader = catalogueLoader();

/** What a page calls. */
export function getCatalogue(): Promise<Catalogue> {
  return defaultLoader.get();
}
