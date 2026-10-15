import { planPrice, type DisplayPrice, type FxRate } from '@/lib/pricing/convert';
import { pricePerGbMinor } from '@/lib/pricing/perUnit';
import type { CurrencyCode } from '@/i18n/config';
import type { PlanCoverage } from '@/lib/types/coverage';
import type { Plan } from '@/lib/types/plan';

/**
 * The plans a region's page compares (the owner, 15 October 2026: the
 * regional plans, and the countries each one covers).
 *
 * A plan is in when its own country list holds at least two of the region's
 * countries. What the provider calls it — "Balkans", "Europe 39" — and the
 * number of destinations it advertises never decide: the page says "covers 7
 * of 9", and that has to be counted from the list we can stand behind.
 *
 * Plans are grouped into families — one provider, one identical country list
 * — because a provider sells the same coverage in many sizes, and a card per
 * size is a page nobody can read. The sizes are summed up on the card; which
 * one fits is the search's job, once the days are known.
 */
export type RegionFamily = {
  key: string;
  providerId: string;
  /** The first plan's coverage, for the provider's own label. */
  coverage: PlanCoverage;
  /** The region's countries this family covers, in the region's order. */
  coveredCodes: string[];
  /** The region's countries missing from the family's list, in the region's order. */
  missingCodes: string[];
  /** How many countries the family covers beyond the region. */
  outsideCount: number;
  plans: Plan[];
};

export const MIN_REGION_COUNTRIES = 2;

export function regionFamilies(plans: readonly Plan[], regionCountries: readonly string[]): RegionFamily[] {
  const inRegion = new Set(regionCountries);
  const families = new Map<string, RegionFamily>();
  for (const plan of plans) {
    const listed = new Set(plan.coverage.countries);
    const covered = regionCountries.filter((code) => listed.has(code));
    if (covered.length < MIN_REGION_COUNTRIES) continue;
    const key = `${plan.providerId}|${[...listed].sort().join(',')}`;
    const family = families.get(key);
    if (family) {
      family.plans.push(plan);
      continue;
    }
    families.set(key, {
      key,
      providerId: plan.providerId,
      coverage: plan.coverage,
      coveredCodes: covered,
      missingCodes: regionCountries.filter((code) => !listed.has(code)),
      outsideCount: [...listed].filter((code) => !inRegion.has(code)).length,
      plans: [plan],
    });
  }
  return [...families.values()];
}

export type PricedPlan = { plan: Plan; price: DisplayPrice };

/** The shortest validity the price per GB is compared over. */
export const PER_GB_MIN_DAYS = 7;

export type PricedFamily = RegionFamily & {
  /** The family's cheapest size, at the price a search would show for it. */
  cheapest: PricedPlan;
  /**
   * The limited size with the lowest price per GB among those valid for a
   * week or more; null when there is none. Shorter sizes are left out: a
   * 500MB day pass is often the lowest per GB, and says nothing about a trip.
   */
  bestPerGb: (PricedPlan & { perGbMinor: number }) | null;
  hasUnlimited: boolean;
};

/**
 * Prices as the search prices them — `planPrice` on the plan's final price,
 * as `buildComparison` does — so a figure on a region card is the figure on
 * the plan's row.
 */
export function priceFamilies(families: readonly RegionFamily[], currency: CurrencyCode, rates: FxRate[]): PricedFamily[] {
  return families.map((family) => {
    const priced = family.plans.map((plan) => ({ plan, price: planPrice(plan, plan.finalPriceMinor, currency, rates) }));
    const cheapest = priced.reduce((best, entry) => (entry.price.amountMinor < best.price.amountMinor ? entry : best));
    let bestPerGb: PricedFamily['bestPerGb'] = null;
    for (const entry of priced) {
      if (entry.plan.validityDays < PER_GB_MIN_DAYS) continue;
      const perGbMinor = pricePerGbMinor(entry.plan, entry.price.amountMinor);
      if (perGbMinor === null) continue;
      if (!bestPerGb || perGbMinor < bestPerGb.perGbMinor) bestPerGb = { ...entry, perGbMinor };
    }
    return { ...family, cheapest, bestPerGb, hasUnlimited: family.plans.some((plan) => plan.isUnlimited) };
  });
}

/**
 * The order the page states: the most of the region first, then the lowest
 * price per GB over a week or more, families with no such size (unlimited
 * only, or day passes only) after those that have one, and the cheapest size
 * last. Commission, clicks and
 * reviews are not inputs here, as nowhere in the comparison.
 */
export function orderFamilies(families: readonly PricedFamily[]): PricedFamily[] {
  return [...families].sort(
    (a, b) =>
      b.coveredCodes.length - a.coveredCodes.length ||
      (a.bestPerGb ? 0 : 1) - (b.bestPerGb ? 0 : 1) ||
      (a.bestPerGb?.perGbMinor ?? 0) - (b.bestPerGb?.perGbMinor ?? 0) ||
      a.cheapest.price.amountMinor - b.cheapest.price.amountMinor ||
      a.key.localeCompare(b.key),
  );
}
