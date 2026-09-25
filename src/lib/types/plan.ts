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
  /** Full-speed allowance, in MB, over the period `per` names. */
  thresholdMb: number | null;
  /**
   * What the allowance is counted over. `null` when the provider gives the
   * figure without saying — and "3GB a day" and "3GB for the whole plan" are
   * different products, so the page does not pick one for them.
   */
  per: 'day' | 'plan' | null;
  /** Speed after the threshold, in kbps. */
  throttledToKbps: number | null;
};

/**
 * The allowance as a daily figure, for scoring.
 *
 * When the period is unknown this takes the less generous reading — the whole
 * plan — so a provider's silence can never rank a plan above one that states
 * its terms.
 */
export function dailyFullSpeedMb(fairUsage: FairUsage | null, validityDays: number): number | null {
  if (!fairUsage?.thresholdMb) return null;
  if (fairUsage.per === 'day') return fairUsage.thresholdMb;
  return fairUsage.thresholdMb / Math.max(1, validityDays);
}

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
  /**
   * The same price as `originalPriceMinor`, as the provider itself charges it
   * in other currencies. A traveller paying in euros is then shown what the
   * provider will actually charge them in euros, rather than our conversion
   * of the dollar price — two figures that can differ, and only one of which
   * appears on their card.
   */
  localPricesMinor?: Partial<Record<CurrencyCode, number>>;

  networks: Network[];
  /**
   * `null` is "the source does not say". It is a third answer, not a polite
   * `false`: showing "no hotspot" for a plan whose provider never mentioned
   * hotspot is a claim about their product we cannot stand behind. Scoring
   * and filters give credit only for `true`.
   */
  hotspot: boolean | null;
  calls: boolean | null;
  sms: boolean | null;
  topUp: boolean | null;

  /**
   * Where the traveller goes to buy, as the source supplied it. Null for a
   * plan whose source has no link — the button then says so rather than
   * pretending to lead somewhere.
   */
  affiliateUrl: string | null;
  /**
   * Where that link lands: on this plan, or on the provider's page for the
   * destination, where the traveller still has to pick it out. Only in the
   * second case does the button say which plan to pick.
   */
  affiliateLandsOn?: 'plan' | 'destination';
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
