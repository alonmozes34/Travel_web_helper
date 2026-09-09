import type { Plan } from '@/lib/types/plan';

/**
 * Where plans come from.
 *
 * The catalogue has one internal shape — `Plan` — and every source maps onto
 * it: an affiliate network's product catalogue, a provider's own partner API,
 * or a hand-maintained file. Nothing downstream of this interface knows or
 * cares which, which is what lets a real source replace the mock one without
 * touching the comparison pipeline.
 *
 * Two rules the interface enforces on every implementation:
 *
 * 1. **A record that cannot be understood is dropped, never guessed.** An
 *    affiliate catalogue is a generic e-commerce feed: it carries a name, a
 *    price and a link, and everything an eSIM comparison needs — how many
 *    gigabytes, how many days, which countries — has to be recovered from
 *    text the provider wrote for humans. When that recovery fails, the item
 *    goes to `skipped` with a reason. A plan on the page saying "10GB" must
 *    mean the source said 10GB.
 *
 * 2. **Skipped records are reported, not silenced.** `skipped` is part of the
 *    result rather than a log line, so a source that silently starts dropping
 *    half its catalogue is visible instead of merely quieter.
 */
export type ProviderSource = {
  /** Stable id, used in logs and in the admin view of a fetch. */
  id: string;
  /** Human-readable, for the same. */
  label: string;
  fetch(): Promise<SourceResult>;
};

export type SourceResult = {
  sourceId: string;
  /** Everything that mapped cleanly onto the internal shape. */
  plans: Plan[];
  /** Everything that did not, with the reason it did not. */
  skipped: SkippedRecord[];
  /** When the fetch ran, ISO 8601. Becomes `lastUpdatedAt` on each plan. */
  fetchedAt: string;
};

export type SkippedRecord = {
  /** The source's own identifier for the record, so it can be looked up. */
  externalId: string;
  /** Whatever name the source gave it, to make the report readable. */
  label: string;
  reason: SkipReason;
  /** The specific detail — which field was missing, what failed to parse. */
  detail: string;
};

export const skipReasons = [
  'unparsable-allowance',
  'unparsable-validity',
  'unknown-destination',
  'missing-price',
  'unsupported-currency',
  'unknown-provider',
  'out-of-stock',
] as const;

export type SkipReason = (typeof skipReasons)[number];

/** Convenience for building a result without repeating the timestamp logic. */
export function sourceResult(
  sourceId: string,
  plans: Plan[],
  skipped: SkippedRecord[],
  fetchedAt = new Date().toISOString(),
): SourceResult {
  return { sourceId, plans, skipped, fetchedAt };
}

/**
 * Merge several sources into one catalogue.
 *
 * Plan ids are namespaced by source upstream, so a collision here means two
 * sources claim the same plan — worth knowing about rather than silently
 * letting one win.
 */
export function mergeResults(results: SourceResult[]): {
  plans: Plan[];
  skipped: SkippedRecord[];
  collisions: string[];
} {
  const byId = new Map<string, Plan>();
  const collisions: string[] = [];
  const skipped: SkippedRecord[] = [];

  for (const result of results) {
    skipped.push(...result.skipped);
    for (const plan of result.plans) {
      if (byId.has(plan.id)) collisions.push(plan.id);
      else byId.set(plan.id, plan);
    }
  }

  return { plans: [...byId.values()], skipped, collisions };
}
