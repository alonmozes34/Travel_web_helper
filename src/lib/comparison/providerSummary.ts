import type { CurrencyCode } from '@/i18n/config';
import { planPrice, type DisplayPrice, type FxRate } from '@/lib/pricing/convert';
import type { Plan } from '@/lib/types/plan';

/**
 * What the comparison holds for one provider, for its profile page: how many
 * plans, for how many destinations, whether any is unlimited, the cheapest at
 * the price a search shows, and where its buy links land. Counted from the
 * live catalogue, never written by hand.
 */
export type ProviderSummary = {
  planCount: number;
  /** Countries at least one of its plans lists. */
  destinationCount: number;
  /** Plans covering more than one country. */
  multiCountryCount: number;
  hasUnlimited: boolean;
  cheapest: { plan: Plan; price: DisplayPrice } | null;
  /** Where most of its buy links land: on the plan, or (ZenSim) on the duration. */
  landsOn: 'plan' | 'duration' | 'destination' | null;
};

export function providerSummary(plans: readonly Plan[], providerId: string, currency: CurrencyCode, rates: FxRate[]): ProviderSummary {
  const own = plans.filter((plan) => plan.providerId === providerId);
  const countries = new Set(own.flatMap((plan) => plan.coverage.countries));
  let cheapest: ProviderSummary['cheapest'] = null;
  const landing: Record<string, number> = {};
  for (const plan of own) {
    const price = planPrice(plan, plan.finalPriceMinor, currency, rates);
    if (!cheapest || price.amountMinor < cheapest.price.amountMinor) cheapest = { plan, price };
    const lands = plan.affiliateLandsOn ?? 'destination';
    landing[lands] = (landing[lands] ?? 0) + 1;
  }
  const landsOn = (Object.entries(landing).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as ProviderSummary['landsOn'];
  return {
    planCount: own.length,
    destinationCount: countries.size,
    multiCountryCount: own.filter((plan) => plan.coverage.countries.length > 1).length,
    hasUnlimited: own.some((plan) => plan.isUnlimited),
    cheapest,
    landsOn,
  };
}
