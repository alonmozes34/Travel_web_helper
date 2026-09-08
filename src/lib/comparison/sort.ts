import type { ComparisonRow } from './buildComparison';

export const sortKeys = ['recommended', 'price', 'pricePerGb', 'data', 'validity'] as const;
export type SortKey = (typeof sortKeys)[number];

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
      return sorted.sort((a, b) => a.price.amountMinor - b.price.amountMinor);
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
      return sorted.sort((a, b) => b.score - a.score);
  }
}
