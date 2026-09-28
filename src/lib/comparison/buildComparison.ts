import type { CurrencyCode } from '@/i18n/config';
import { mockPlans } from '@/data/mockPlans';
import { getProvider } from '@/data/providers';
import { mockFxRates } from '@/data/fxRates';
import { planPrice, type DisplayPrice, type FxRate } from '@/lib/pricing/convert';
import { pricePerDayMinor, pricePerGbMinor } from '@/lib/pricing/perUnit';
import { hasDiscount, type Plan } from '@/lib/types/plan';
import type { Provider } from '@/lib/types/provider';
import { destinationCodes, type TripProfile } from '@/lib/types/trip';
import { buildCombination, type Combination } from './buildCombination';
import { estimateDataNeed, type DataNeedEstimate } from './estimateDataNeed';
import {
  recommend,
  unlimitedCost,
  type Recommendation,
  type RecommendationKey,
} from './recommend';
import { browsingScore, scorePlans, type ScoreBreakdown } from './scorePlan';

export type ComparisonRow = {
  plan: Plan;
  provider: Provider;
  /** Final price in the traveller's display currency. */
  price: DisplayPrice;
  /** Pre-discount price, only when the plan is actually discounted. */
  originalPrice: DisplayPrice | null;
  pricePerGbMinor: number | null;
  pricePerDayMinor: number | null;
  score: number;
  /** Published-facts score behind the "best for browsing" category. */
  browsingScore: number;
  /**
   * Ranking figure behind the "best unlimited" category — lower is better,
   * null for a plan that is not unlimited. Carried on the row so the category
   * tab and the badge cannot drift apart: they are the same number.
   */
  unlimitedCostMinor: number | null;
  breakdown: ScoreBreakdown;
  isBelowEstimatedNeed: boolean;
  coversTrip: boolean;
  /**
   * How many days of the traveller's own estimated usage this data lasts.
   * "5GB" means nothing to most people; "about 8 days of normal use" does.
   * Derived from the same daily figure the estimate uses, never invented.
   */
  daysOfData: number | null;
  /** Recommendation badges this plan won, if any. */
  badges: RecommendationKey[];
};

export type Comparison = {
  /** Every destination on the trip, in the order the traveller entered them. */
  countryCodes: string[];
  currency: CurrencyCode;
  estimate: DataNeedEstimate;
  rows: ComparisonRow[];
  recommendations: Partial<Record<RecommendationKey, Recommendation>>;
  planCount: number;
  /** Derived from the data, never asserted in copy. */
  providerCount: number;
  /** True while any row still comes from mock data. */
  isMockData: boolean;
  /**
   * True when EVERY row is mock data, which is the only state in which a
   * page-wide "the prices here are not real" is a true sentence.
   *
   * The two flags exist separately because the interesting case is between
   * them: one real provider connected alongside the demo catalogue. A banner
   * that says all prices are invented then says it about a real one too —
   * wrong in the safe direction, but still wrong, and it throws away the
   * credibility of the first real figure on the site. When they disagree, the
   * rows carry the marker and the banner says "some".
   */
  allMockData: boolean;
  /**
   * The best set of plans covering a multi-stop trip, when one exists and no
   * single plan does the job better. Null for single-destination searches.
   */
  combination: Combination | null;
};

/**
 * Turn a destination and a trip profile into everything the results page
 * needs: prices in one currency, per-unit figures, value scores and the
 * recommendation badges.
 *
 * Scoring happens after conversion so that plans priced in dollars and euros
 * are compared on the same scale.
 */
/** Every plan that works in all of the given destinations at once. */
function plansCoveringAll(plans: Plan[], countryCodes: string[]): Plan[] {
  if (countryCodes.length === 0) return plans;
  return plans.filter((plan) => countryCodes.every((code) => plan.coverage.countries.includes(code)));
}

export function buildComparison({
  profile,
  currency,
  plans,
  rates = mockFxRates,
}: {
  profile: TripProfile;
  currency: CurrencyCode;
  /**
   * The whole catalogue, from whichever sources supplied it. Filtering to the
   * trip happens here, so a caller hands over everything it has and does not
   * have to know what "covers this trip" means.
   *
   * Defaults to the demo catalogue so the scoring tests stay a page long.
   */
  plans?: Plan[];
  rates?: FxRate[];
}): Comparison {
  const countryCodes = destinationCodes(profile);
  // Results are plans that cover the whole trip. Anything less is offered as a
  // combination instead, never mixed into the list as if it were a full answer.
  const candidates = plansCoveringAll(plans ?? mockPlans, countryCodes);
  const estimate = estimateDataNeed(profile);

  const priceByPlanId = new Map<string, number>();
  const displayByPlanId = new Map<string, DisplayPrice>();

  for (const plan of candidates) {
    const price = planPrice(plan, plan.finalPriceMinor, currency, rates);
    displayByPlanId.set(plan.id, price);
    priceByPlanId.set(plan.id, price.amountMinor);
  }

  const scored = scorePlans(withoutRedundant(candidates, estimate.days, priceByPlanId), { estimate, priceByPlanId });
  const recommendations = recommend(scored, { estimate, priceByPlanId, countryCodes });

  const badgesByPlanId = new Map<string, RecommendationKey[]>();
  for (const recommendation of Object.values(recommendations)) {
    const existing = badgesByPlanId.get(recommendation.planId) ?? [];
    existing.push(recommendation.key);
    badgesByPlanId.set(recommendation.planId, existing);
  }

  // The traveller's own daily rate, so "how long does this last" is answered
  // in their terms rather than against an average nobody chose.
  const dailyMb = estimate.days > 0 ? estimate.requiredMb / estimate.days : 0;

  const rows: ComparisonRow[] = scored.map((entry) => {
    const price = displayByPlanId.get(entry.plan.id)!;
    const originalPrice = hasDiscount(entry.plan)
      ? planPrice(entry.plan, entry.plan.originalPriceMinor, currency, rates)
      : null;

    return {
      plan: entry.plan,
      provider: getProvider(entry.plan.providerId) ?? fallbackProvider(entry.plan.providerId),
      price,
      originalPrice,
      pricePerGbMinor: pricePerGbMinor(entry.plan, price.amountMinor),
      pricePerDayMinor: pricePerDayMinor(price.amountMinor, entry.plan.validityDays),
      score: entry.score,
      browsingScore: browsingScore(entry.plan, estimate, countryCodes),
      unlimitedCostMinor: entry.plan.isUnlimited
        ? unlimitedCost(entry.plan, estimate, price.amountMinor)
        : null,
      breakdown: entry.breakdown,
      isBelowEstimatedNeed: entry.isBelowEstimatedNeed,
      coversTrip: entry.coversTrip,
      daysOfData:
        entry.plan.isUnlimited || dailyMb <= 0
          ? null
          : Math.max(1, Math.round(entry.plan.dataAmountMb / dailyMb)),
      badges: badgesByPlanId.get(entry.plan.id) ?? [],
    };
  });

  return {
    countryCodes,
    currency,
    estimate,
    rows,
    recommendations,
    planCount: rows.length,
    providerCount: new Set(rows.map((row) => row.plan.providerId)).size,
    isMockData: rows.some((row) => row.plan.source === 'mock'),
    allMockData: rows.length > 0 && rows.every((row) => row.plan.source === 'mock'),
    combination: buildCombination({
      profile,
      // The whole catalogue, not the filtered set: a combination exists
      // precisely because no single plan covers the trip, so it has to look at
      // the plans that were just excluded.
      plans: plans ?? mockPlans,
      currency,
      rates,
    }),
  };
}

/** A provider id with no record is a data bug, not a reason to crash a page. */
function fallbackProvider(id: string): Provider {
  return { id, name: id, slug: id, brandColor: '#5A6D7E', activation: null };
}

/**
 * Drops a plan when the same provider sells another for the same places that
 * lasts the whole trip, gives at least as much data, and costs no more.
 *
 * Some providers sell a plan for every length from one day to thirty. For a
 * ten-day trip the eleven-, twelve- and thirteen-day versions of the same
 * unlimited plan cost more and give nothing the ten-day one does not, and
 * listed one under another they bury every other provider. Nothing is hidden
 * that could be the better buy for this trip: the plan that stays is at
 * least as good on every count a traveller is choosing on here. Plans from
 * different providers are never compared this way — that is the comparison
 * itself.
 */
export function withoutRedundant(plans: Plan[], tripDays: number, priceByPlanId: Map<string, number>): Plan[] {
  const places = (plan: Plan) => [...plan.coverage.countries].sort().join(',');
  const price = (plan: Plan) => priceByPlanId.get(plan.id) ?? Infinity;
  const sameKindOfData = (a: Plan, b: Plan) =>
    a.isUnlimited === b.isUnlimited &&
    (a.isUnlimited ? JSON.stringify(a.fairUsage) === JSON.stringify(b.fairUsage) : a.dataAmountMb >= b.dataAmountMb);

  const coversAsWell = (a: Plan, b: Plan) =>
    a.providerId === b.providerId &&
    places(a) === places(b) &&
    a.validityDays >= tripDays &&
    sameKindOfData(a, b) &&
    price(a) <= price(b);

  return plans.filter(
    (b) =>
      !plans.some((a) => {
        if (a === b || !coversAsWell(a, b)) return false;
        // Two plans that each cover the other exactly as well: keep one.
        return coversAsWell(b, a) ? a.id < b.id : true;
      }),
  );
}

