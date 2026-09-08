import { hasTechnology } from '@/lib/types/network';
import type { Plan } from '@/lib/types/plan';
import type { DataNeedEstimate } from './estimateDataNeed';

/**
 * Value scoring.
 *
 * The rule this exists to enforce: price-per-GB alone is not value. A plan is
 * judged first on whether it actually covers the trip, then on price, then on
 * whether any extra data it carries is cheap enough to be worth having.
 *
 * Worked example — traveller needs 10GB:
 *   A  10GB / ₪60   covers the need exactly
 *   B  20GB / ₪62   the extra 10GB costs ₪2, so B scores higher than A
 *   C  50GB / ₪90   far more data, but ₪30 more for headroom nobody needs,
 *                   so C scores below both despite the lowest price per GB
 *
 * The scorer receives plan facts and the trip profile. It receives no
 * commission data, because the model has none.
 */
export const scoreWeights = {
  /** How well the allowance covers the estimated need. */
  needFit: 0.28,
  /** Total price, relative to the other plans for this destination. */
  price: 0.52,
  /** Extra data beyond the need, with diminishing returns. */
  headroom: 0.12,
  /** Hotspot, 5G, top-up. Bonuses, never thresholds. */
  features: 0.08,
} as const;

/** A plan whose validity is shorter than the trip is very nearly disqualified. */
export const SHORT_VALIDITY_FACTOR = 0.15;

export type ScoreBreakdown = {
  needFit: number;
  price: number;
  headroom: number;
  features: number;
  validityFactor: number;
  fairUsageFactor: number;
};

export type ScoredPlan = {
  plan: Plan;
  /** 0–100. */
  score: number;
  breakdown: ScoreBreakdown;
  /** Set when the allowance is below the estimated need — shown, not hidden. */
  isBelowEstimatedNeed: boolean;
  coversTrip: boolean;
};

export type ScoringContext = {
  estimate: DataNeedEstimate;
  /** Display-currency price per plan id, so scoring compares like with like. */
  priceByPlanId: Map<string, number>;
};

/**
 * Coverage of the estimated need.
 *
 * Falling short is penalised quadratically: half the data you need scores 0.25,
 * not 0.5, because running out mid-trip is not half a plan.
 */
export function needFitScore(plan: Plan, estimate: DataNeedEstimate): number {
  if (plan.isUnlimited) return 1;
  if (estimate.requiredMb <= 0) return 1;
  const ratio = plan.dataAmountMb / estimate.requiredMb;
  return ratio >= 1 ? 1 : Math.max(0, ratio) ** 2;
}

/**
 * Value of data beyond the need, with diminishing returns: one extra trip's
 * worth of data is worth a lot, five are worth barely more than two.
 */
export function headroomScore(plan: Plan, estimate: DataNeedEstimate): number {
  if (plan.isUnlimited) return 0.8;
  if (estimate.requiredMb <= 0) return 0;
  const extra = Math.max(0, plan.dataAmountMb - estimate.requiredMb);
  return 1 - Math.exp(-extra / estimate.requiredMb);
}

/** Hotspot and 5G are what travellers actually ask about; top-up is a nicety. */
export function featureScore(plan: Plan): number {
  let score = 0;
  if (plan.hotspot) score += 0.4;
  if (hasTechnology(plan.networks, '5G')) score += 0.4;
  if (plan.topUp) score += 0.2;
  return score;
}

/**
 * Fair usage on an unlimited plan. A daily cap at or above the estimated daily
 * need costs nothing; a cap well below it is a real limitation.
 */
export function fairUsageFactor(plan: Plan, estimate: DataNeedEstimate): number {
  const threshold = plan.fairUsage?.dailyThresholdMb;
  if (!plan.isUnlimited || !threshold || estimate.dailyMb <= 0) return 1;
  const ratio = threshold / estimate.dailyMb;
  if (ratio >= 1) return 1;
  // 0.6 at a cap of zero, rising to 1 at a cap that meets the daily need.
  return 0.6 + 0.4 * Math.max(0, ratio);
}

/**
 * Price relative to the cheapest plan on the page: 1.0 for the cheapest, 0.5
 * for one that costs twice as much.
 *
 * This is a ratio rather than a min-max spread on purpose. Spreading between
 * the cheapest and dearest plan lets a single outlier — typically an unlimited
 * plan at four times the price — compress every real difference beneath it, so
 * a plan costing 45% more than its neighbour would score almost the same. A
 * ratio is scale-free and unaffected by what sits at the top of the range.
 */
function relativePriceScore(price: number, min: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (min <= 0) return 1;
  return Math.min(1, min / price);
}

/**
 * Score every plan for one destination together, because "cheap" only means
 * anything relative to the alternatives on the same page.
 */
export function scorePlans(plans: Plan[], context: ScoringContext): ScoredPlan[] {
  const { estimate, priceByPlanId } = context;

  const prices = plans
    .map((plan) => priceByPlanId.get(plan.id))
    .filter((price): price is number => typeof price === 'number');
  const min = prices.length ? Math.min(...prices) : 0;

  return plans
    .map((plan) => {
      const price = priceByPlanId.get(plan.id);
      const breakdown: ScoreBreakdown = {
        needFit: needFitScore(plan, estimate),
        price: relativePriceScore(price ?? Number.POSITIVE_INFINITY, min),
        headroom: headroomScore(plan, estimate),
        features: featureScore(plan),
        validityFactor: plan.validityDays >= estimate.days ? 1 : SHORT_VALIDITY_FACTOR,
        fairUsageFactor: fairUsageFactor(plan, estimate),
      };

      const weighted =
        breakdown.needFit * scoreWeights.needFit +
        breakdown.price * scoreWeights.price +
        breakdown.headroom * scoreWeights.headroom +
        breakdown.features * scoreWeights.features;

      const score = weighted * breakdown.validityFactor * breakdown.fairUsageFactor * 100;

      return {
        plan,
        score: Math.round(score * 10) / 10,
        breakdown,
        isBelowEstimatedNeed: !plan.isUnlimited && plan.dataAmountMb < estimate.requiredMb,
        coversTrip: plan.validityDays >= estimate.days,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * "Best for browsing" — the V1 stand-in for a coverage recommendation.
 *
 * It deliberately uses only facts a provider publishes: network technology,
 * how many local networks the plan can use, hotspot, allowance and
 * limitations. It does not use coverage ratings, and it is not price-driven.
 */
export function browsingScore(plan: Plan, estimate: DataNeedEstimate): number {
  let score = 0;
  if (hasTechnology(plan.networks, '5G')) score += 0.35;
  if (plan.networks.length >= 2) score += 0.15;
  if (plan.hotspot) score += 0.15;

  const generosity = plan.isUnlimited ? 1 : Math.min(1, needFitScore(plan, estimate));
  score += 0.25 * generosity;

  score += 0.1 * fairUsageFactor(plan, estimate);
  return score;
}
