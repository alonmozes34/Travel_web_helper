import type { CurrencyCode } from '@/i18n/config';
import { getPlansCoveringAll } from '@/data/mockPlans';
import { getProvider, mockProviders } from '@/data/mockProviders';
import { mockFxRates } from '@/data/fxRates';
import { convertPrice, type DisplayPrice, type FxRate } from '@/lib/pricing/convert';
import { pricePerDayMinor, pricePerGbMinor } from '@/lib/pricing/perUnit';
import { hasDiscount, type Plan } from '@/lib/types/plan';
import type { Provider } from '@/lib/types/provider';
import { destinationCodes, type TripProfile } from '@/lib/types/trip';
import { buildCombination, type Combination } from './buildCombination';
import { estimateDataNeed, type DataNeedEstimate } from './estimateDataNeed';
import { recommend, type Recommendation, type RecommendationKey } from './recommend';
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
export function buildComparison({
  profile,
  currency,
  plans,
  rates = mockFxRates,
}: {
  profile: TripProfile;
  currency: CurrencyCode;
  /** Defaults to every plan covering all of the trip's destinations. */
  plans?: Plan[];
  rates?: FxRate[];
}): Comparison {
  const countryCodes = destinationCodes(profile);
  // Results are plans that cover the whole trip. Anything less is offered as a
  // combination instead, never mixed into the list as if it were a full answer.
  const candidates = plans ?? getPlansCoveringAll(countryCodes);
  const estimate = estimateDataNeed(profile);

  const priceByPlanId = new Map<string, number>();
  const displayByPlanId = new Map<string, DisplayPrice>();

  for (const plan of candidates) {
    const price = convertPrice(plan.finalPriceMinor, plan.sourceCurrency, currency, rates);
    displayByPlanId.set(plan.id, price);
    priceByPlanId.set(plan.id, price.amountMinor);
  }

  const scored = scorePlans(candidates, { estimate, priceByPlanId });
  const recommendations = recommend(scored, { estimate, priceByPlanId });

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
      ? convertPrice(entry.plan.originalPriceMinor, entry.plan.sourceCurrency, currency, rates)
      : null;

    return {
      plan: entry.plan,
      provider: getProvider(entry.plan.providerId) ?? fallbackProvider(entry.plan.providerId),
      price,
      originalPrice,
      pricePerGbMinor: pricePerGbMinor(entry.plan, price.amountMinor),
      pricePerDayMinor: pricePerDayMinor(price.amountMinor, entry.plan.validityDays),
      score: entry.score,
      browsingScore: browsingScore(entry.plan, estimate),
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
    combination: buildCombination({
      profile,
      plans: getPlansCoveringAll([]),
      currency,
      rates,
    }),
  };
}

/** A provider id with no record is a data bug, not a reason to crash a page. */
function fallbackProvider(id: string): Provider {
  return { id, name: id, slug: id, brandColor: '#5A6D7E', activation: 'both' };
}

/** Total distinct providers across all destinations, for copy that needs it. */
export const totalProviderCount = mockProviders.length;
