import type { CurrencyCode } from '@/i18n/config';
import type { Plan } from '@/lib/types/plan';
import { planPrice, type FxRate } from '@/lib/pricing/convert';
import { estimateDataNeed, type DataNeedEstimate } from './estimateDataNeed';
import type { TripDestination, TripProfile } from '@/lib/types/trip';

export type CombinationLeg = {
  plan: Plan;
  /** The destinations this plan is bought for. */
  countryCodes: string[];
  priceMinor: number;
  sourcePriceMinor: number;
  sourceCurrency: CurrencyCode;
};

export type Combination = {
  legs: CombinationLeg[];
  totalMinor: number;
  currency: CurrencyCode;
};

/**
 * Build the cheapest sensible set of plans covering a multi-stop trip.
 *
 * When a traveller stops in Germany for a night and then flies to the States,
 * often no single plan covers both at a sane price — but two local plans do.
 * No provider will ever point that out, which is exactly why a comparison site
 * should.
 *
 * The search is a greedy set cover minimising cost per stop covered, among
 * plans that are actually adequate for the stops they would be bought for —
 * enough data for those days, and validity that outlasts them. Cost is the
 * objective rather than the general value score on purpose: the combination
 * only earns its place by being cheaper, and a scorer that weighs headroom and
 * features would happily pick a dearer plan and lose the argument.
 *
 * Each leg is sized for its own days, so a one-night stop is not charged for a
 * fortnight of data. A plan covering two remaining stops is bought once.
 */
export function buildCombination({
  profile,
  plans,
  currency,
  rates,
}: {
  profile: TripProfile;
  plans: Plan[];
  currency: CurrencyCode;
  rates: FxRate[];
}): Combination | null {
  const codes = profile.destinations.map((destination) => destination.countryCode);
  if (codes.length < 2) return null;

  const uncovered = new Set(codes);
  const legs: CombinationLeg[] = [];
  const priceOf = (plan: Plan) => planPrice(plan, plan.finalPriceMinor, currency, rates);

  // A destination with no plan at all means there is no combination to offer.
  for (const code of codes) {
    if (!plans.some((plan) => plan.coverage.countries.includes(code))) return null;
  }

  const legFor = (code: string): TripDestination =>
    profile.destinations.find((destination) => destination.countryCode === code) ?? {
      countryCode: code,
    };

  while (uncovered.size > 0) {
    const remaining = [...uncovered];
    const candidates = plans.filter((plan) =>
      remaining.some((code) => plan.coverage.countries.includes(code)),
    );
    if (candidates.length === 0) return null;

    const options = candidates.map((plan) => {
      const covers = remaining.filter((code) => plan.coverage.countries.includes(code));
      const estimate = estimateDataNeed({
        usage: profile.usage,
        destinations: covers.map(legFor),
      });
      const price = priceOf(plan).amountMinor;

      return {
        plan,
        covers,
        price,
        costPerStop: price / covers.length,
        // Adequate means it lasts the stay and carries enough data for it.
        isAdequate:
          plan.validityDays >= estimate.days &&
          (plan.isUnlimited || plan.dataAmountMb >= estimate.requiredMb),
      };
    });

    // Prefer plans that actually do the job; only fall back to the rest when
    // nothing adequate covers a stop, rather than silently recommending a plan
    // that runs out.
    const adequate = options.filter((option) => option.isAdequate);
    const pool = adequate.length ? adequate : options;
    const best = pool.sort(
      (a, b) => a.costPerStop - b.costPerStop || b.covers.length - a.covers.length,
    )[0];

    if (!best) return null;

    const price = priceOf(best.plan);
    legs.push({
      plan: best.plan,
      countryCodes: best.covers,
      priceMinor: price.amountMinor,
      sourcePriceMinor: price.sourceAmountMinor,
      sourceCurrency: price.sourceCurrency,
    });
    best.covers.forEach((code) => uncovered.delete(code));
  }

  // One plan covering everything is not a combination, it is just that plan.
  if (legs.length < 2) return null;

  return {
    legs,
    totalMinor: legs.reduce((sum, leg) => sum + leg.priceMinor, 0),
    currency,
  };
}

export type { DataNeedEstimate };

/**
 * Whether a combination is worth offering beside the single plans: only when
 * no single plan does the job, or when it costs less than the cheapest one
 * that does. "Does the job" means lasting the trip and carrying the data — the
 * cheapest row on a page is often a 1GB plan that covers nothing.
 */
export function shouldOfferCombination(
  combination: Combination | null,
  rows: Array<{ coversTrip: boolean; isBelowEstimatedNeed: boolean; price: { amountMinor: number } }>,
): { offer: boolean; cheapestSingleMinor: number | null } {
  const fitting = rows.filter((row) => row.coversTrip && !row.isBelowEstimatedNeed);
  const cheapestSingleMinor = fitting.length ? Math.min(...fitting.map((row) => row.price.amountMinor)) : null;
  const offer = combination !== null && (cheapestSingleMinor === null || combination.totalMinor < cheapestSingleMinor);
  return { offer, cheapestSingleMinor };
}
