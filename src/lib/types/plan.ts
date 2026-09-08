import type { CurrencyCode } from '@/i18n/config';
import type { PlanCoverage } from './coverage';
import type { Discount } from './discount';
import type { Network } from './network';

/** Whether a record came from mock data or a real provider API. */
export type PlanSource = 'mock' | 'api';

/**
 * Fair usage on an "unlimited" plan. Stored as numbers rather than prose so
 * the note can be written in any language and the severity can be scored.
 */
export type FairUsage = {
  /** Full-speed allowance per day, in MB. */
  dailyThresholdMb: number | null;
  /** Speed after the threshold, in kbps. */
  throttledToKbps: number | null;
};

/**
 * The one internal shape every provider adapter maps onto.
 *
 * Note what is absent: there is no `commission`, `payout`, `epc` or
 * `manualRank` field. The recommendation scorer only ever receives the facts
 * below plus the traveller's trip profile, which makes "we do not rank by
 * commission" verifiable in code rather than a claim in copy.
 */
export type Plan = {
  id: string;
  providerId: string;
  /** The provider's own plan name, so a traveller can verify it on their site. */
  planName: string;
  /**
   * Where the plan works. A plan is not tied to one country: providers sell
   * single-country, regional and global plans, and a traveller with two stops
   * needs all three compared side by side.
   */
  coverage: PlanCoverage;

  /** Allowance in MB. `0` when `isUnlimited`. */
  dataAmountMb: number;
  isUnlimited: boolean;
  fairUsage: FairUsage | null;
  validityDays: number;

  /** The currency the provider actually charges in. */
  sourceCurrency: CurrencyCode;
  /** Price before discount, in the source currency's minor unit. */
  originalPriceMinor: number;
  /** Price after discount, in the source currency's minor unit. */
  finalPriceMinor: number;
  discount: Discount | null;

  networks: Network[];
  hotspot: boolean;
  calls: boolean;
  sms: boolean;
  topUp: boolean;

  /** Not implemented in the prototype — always null. */
  affiliateUrl: string | null;
  source: PlanSource;
  /** Only shown once a real API supplies it. */
  lastUpdatedAt: string | null;
};

export function savingsMinor(plan: Plan): number {
  return Math.max(0, plan.originalPriceMinor - plan.finalPriceMinor);
}

export function hasDiscount(plan: Plan): boolean {
  return plan.discount !== null && savingsMinor(plan) > 0;
}
