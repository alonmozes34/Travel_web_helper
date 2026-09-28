import type { ComparisonRow } from './buildComparison';

export const sortKeys = ['recommended', 'price', 'pricePerGb', 'data', 'validity'] as const;
export type SortKey = (typeof sortKeys)[number];

/**
 * The order a list opens in: cheapest first. The owner, 28 September 2026:
 * "the plans are ordered by price, not by provider, unless the traveller has
 * filtered otherwise." "Recommended" (the value score) is one choice away.
 */
export const DEFAULT_SORT: SortKey = 'price';

export function isSortKey(value: string): value is SortKey {
  return (sortKeys as readonly string[]).includes(value);
}

/**
 * Sorting never changes which plans are shown, only their order. Unlimited
 * plans have no price per GB, so they sort last under that key rather than
 * being given a fabricated figure.
 */
export function sortRows(rows: ComparisonRow[], key: SortKey): ComparisonRow[] {
  const sorted = [...rows];

  switch (key) {
    case 'price':
      // Ties, which are common within a provider, go to the better-scoring
      // plan, so the order does not depend on the order plans arrived in.
      return sorted.sort((a, b) => a.price.amountMinor - b.price.amountMinor || b.score - a.score);
    case 'pricePerGb':
      return sorted.sort((a, b) => {
        const left = a.pricePerGbMinor ?? Number.POSITIVE_INFINITY;
        const right = b.pricePerGbMinor ?? Number.POSITIVE_INFINITY;
        return left - right;
      });
    case 'data':
      return sorted.sort((a, b) => {
        if (a.plan.isUnlimited !== b.plan.isUnlimited) return a.plan.isUnlimited ? -1 : 1;
        return b.plan.dataAmountMb - a.plan.dataAmountMb;
      });
    case 'validity':
      return sorted.sort((a, b) => b.plan.validityDays - a.plan.validityDays);
    case 'recommended':
    default:
      // The order the comparison already put them in: by score, then repaired
      // so that no plan sits below a cheaper one with the same days and data
      // (`dominates`). Re-sorting by score here undid that repair on the page
      // — 27 of 360 audited searches after it shipped.
      return sorted;
  }
}
