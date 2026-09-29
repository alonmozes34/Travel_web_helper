import { hasTechnology, networksForDestinations } from '@/lib/types/network';
import type { Plan } from '@/lib/types/plan';

/**
 * What the "best value" plan has that the cheapest plan doing the same job
 * does not — only facts both providers published, and only differences the
 * score actually rewards.
 */
export type BestValueReason =
  /** Unlimited, and says after how much the speed drops, where the cheaper one does not say. */
  | 'statesSlowdown'
  /** Unlimited, where the cheaper one has a fixed allowance. */
  | 'unlimited'
  /** More data than the cheaper one. */
  | 'moreData'
  /** A 5G network at the destination, where the cheaper one lists none. */
  | 'fiveG'
  /** More local networks at the destination. */
  | 'moreNetworks'
  /** Hotspot stated as allowed, where the cheaper one does not say so. */
  | 'hotspot';

export type BestValueWhy = {
  /** The cheapest plan that does the same job, which the best-value plan was preferred to. */
  cheapestPlanId: string;
  /** How much more the best-value plan costs, in the display currency's minor units. */
  extraMinor: number;
  /** Empty when the difference is only in the weighing, not in one fact we can name. */
  reasons: BestValueReason[];
};

/**
 * Why "best value" went to a dearer plan than "cheapest" — so the page can
 * say what the extra money buys. Null when the best-value plan is the
 * cheapest, or costs no more.
 *
 * Written after the owner found "best value" on the dearest of three
 * unlimited plans for thirty days in the US (29 September 2026): aloSIM at
 * ₪211, against Yesim at ₪157 and ZenSim at ₪175. The score was right by its
 * rules — aloSIM states its slowdown and lists 5G; the others state neither —
 * but the page never said so, and a badge nobody can explain reads as a
 * mistake or a paid placement.
 */
export function explainBestValue(
  best: Plan,
  cheapest: Plan,
  priceOf: (plan: Plan) => number,
  countryCodes: string[] = [],
): BestValueWhy | null {
  if (best.id === cheapest.id) return null;
  const extraMinor = priceOf(best) - priceOf(cheapest);
  if (!(extraMinor > 0)) return null;

  const reasons: BestValueReason[] = [];
  if (best.isUnlimited && cheapest.isUnlimited && best.fairUsage?.thresholdMb && !cheapest.fairUsage?.thresholdMb) {
    reasons.push('statesSlowdown');
  }
  if (best.isUnlimited && !cheapest.isUnlimited) reasons.push('unlimited');
  if (!best.isUnlimited && !cheapest.isUnlimited && best.dataAmountMb > cheapest.dataAmountMb) reasons.push('moreData');

  const bestNetworks = networksForDestinations(best.networks, countryCodes);
  const cheapNetworks = networksForDestinations(cheapest.networks, countryCodes);
  if (hasTechnology(bestNetworks, '5G') && !hasTechnology(cheapNetworks, '5G')) reasons.push('fiveG');
  if (bestNetworks.length >= 2 && bestNetworks.length > cheapNetworks.length) reasons.push('moreNetworks');
  if (best.hotspot === true && cheapest.hotspot !== true) reasons.push('hotspot');

  return { cheapestPlanId: cheapest.id, extraMinor, reasons };
}
