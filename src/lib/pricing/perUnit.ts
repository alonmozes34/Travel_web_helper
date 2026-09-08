import { MB_PER_GB } from '@/lib/formatters/data';
import type { Plan } from '@/lib/types/plan';

/**
 * Price per GB, in the display currency's minor unit.
 *
 * Returns `null` for unlimited plans, where the figure has no meaning — those
 * are compared per day instead.
 */
export function pricePerGbMinor(plan: Plan, displayAmountMinor: number): number | null {
  if (plan.isUnlimited || plan.dataAmountMb <= 0) return null;
  const gb = plan.dataAmountMb / MB_PER_GB;
  return Math.round(displayAmountMinor / gb);
}

/** Price per day of validity, in the display currency's minor unit. */
export function pricePerDayMinor(displayAmountMinor: number, validityDays: number): number | null {
  if (validityDays <= 0) return null;
  return Math.round(displayAmountMinor / validityDays);
}
