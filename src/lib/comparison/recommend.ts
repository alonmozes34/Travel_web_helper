import type { Plan } from '@/lib/types/plan';
import type { DataNeedEstimate } from './estimateDataNeed';
import { browsingScore, fairUsageFactor, type ScoredPlan } from './scorePlan';

/**
 * V1 recommendation categories.
 *
 * `bestForBrowsing` replaces a coverage recommendation on purpose: it uses only
 * facts providers publish — 5G, how many local networks a plan can use,
 * hotspot, allowance, limitations — and makes no claim about real-world
 * coverage. A separate "best coverage" category can be added once a measurable
 * external source exists.
 */
export const recommendationKeys = [
  'bestValue',
  'cheapest',
  'bestForBrowsing',
  'bestUnlimited',
] as const;

export type RecommendationKey = (typeof recommendationKeys)[number];

export type Recommendation = {
  key: RecommendationKey;
  planId: string;
  /** True when the winner does not cover the estimated data need. */
  isBelowEstimatedNeed: boolean;
};

export type RecommendationContext = {
  estimate: DataNeedEstimate;
  priceByPlanId: Map<string, number>;
};

/**
 * A category with nothing to say is omitted entirely. It never quietly falls
 * back to another category's winner, because a badge the traveller cannot
 * trust is worse than no badge.
 */
export function recommend(
  scored: ScoredPlan[],
  context: RecommendationContext,
): Partial<Record<RecommendationKey, Recommendation>> {
  const result: Partial<Record<RecommendationKey, Recommendation>> = {};
  if (scored.length === 0) return result;

  const { estimate, priceByPlanId } = context;
  const priceOf = (plan: Plan) => priceByPlanId.get(plan.id) ?? Number.POSITIVE_INFINITY;
  const entryFor = (key: RecommendationKey, entry: ScoredPlan): Recommendation => ({
    key,
    planId: entry.plan.id,
    isBelowEstimatedNeed: entry.isBelowEstimatedNeed,
  });

  const best = scored[0];
  if (best) result.bestValue = entryFor('bestValue', best);

  // Cheapest still has to last the trip; if nothing does, we say nothing.
  const longEnough = scored.filter((entry) => entry.coversTrip);
  const cheapest = [...longEnough].sort((a, b) => priceOf(a.plan) - priceOf(b.plan))[0];
  if (cheapest) result.cheapest = entryFor('cheapest', cheapest);

  if (scored.length > 1) {
    const forBrowsing = [...scored].sort(
      (a, b) => browsingScore(b.plan, estimate) - browsingScore(a.plan, estimate),
    )[0];
    if (forBrowsing) result.bestForBrowsing = entryFor('bestForBrowsing', forBrowsing);
  }

  // Among unlimited plans, cost per day adjusted for how strict the fair-usage
  // policy is: an "unlimited" plan that throttles at 1GB a day is not the equal
  // of one that throttles at 5GB.
  const unlimited = scored.filter((entry) => entry.plan.isUnlimited && entry.coversTrip);
  const bestUnlimited = [...unlimited].sort((a, b) => {
    const costPerDay = (entry: ScoredPlan) =>
      priceOf(entry.plan) / Math.max(1, entry.plan.validityDays) / fairUsageFactor(entry.plan, estimate);
    return costPerDay(a) - costPerDay(b);
  })[0];
  if (bestUnlimited) result.bestUnlimited = entryFor('bestUnlimited', bestUnlimited);

  return result;
}
