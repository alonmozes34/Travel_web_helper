import type { CurrencyCode } from '@/i18n/config';
import type { Plan } from '@/lib/types/plan';

/**
 * Price history: one snapshot a day of every listed plan's price, as the
 * provider charges it, and a summary the pages read (the owner, 2 October
 * 2026: "the price dropped").
 *
 * Prices are compared in the provider's own currency, never in shekels, so a
 * move in the exchange rate is never shown as a price change. Everything
 * here is our own record of what the providers' prices were on each day we
 * looked — nothing is estimated, and nothing is said before there is
 * history to say it from.
 */

export type PriceSnapshot = {
  /** YYYY-MM-DD, Israel time. */
  date: string;
  prices: Record<string, { minor: number; currency: CurrencyCode }>;
};

export type PlanHistory = {
  /** The price on the most recent earlier day it was seen. */
  previousMinor: number;
  previousDate: string;
  /** The lowest price over the days summarised, and the latest day it was that low. */
  lowestMinor: number;
  lowestDate: string;
  /** The highest, so "lowest in N days" is only said of a price that moved. */
  highestMinor: number;
  currency: CurrencyCode;
  /** On how many of those days the plan was seen. */
  daysSeen: number;
};

export type PriceSummary = {
  /** The newest snapshot's date. */
  updatedOn: string;
  /** How many days the summary covers. */
  days: number;
  plans: Record<string, PlanHistory>;
};

/** How far back "the lowest in N days" looks. */
export const HISTORY_DAYS = 30;

export function snapshotOf(plans: readonly Plan[], date: string): PriceSnapshot {
  const prices: PriceSnapshot['prices'] = {};
  for (const plan of plans) prices[plan.id] = { minor: plan.finalPriceMinor, currency: plan.sourceCurrency };
  return { date, prices };
}

/**
 * The summary of up to HISTORY_DAYS snapshots, newest last. "Previous" is the
 * day before the newest one the plan appears on; a plan seen on one day only
 * has no history yet and is left out.
 */
export function summarise(snapshots: readonly PriceSnapshot[]): PriceSummary | null {
  const ordered = [...snapshots].sort((a, b) => a.date.localeCompare(b.date)).slice(-HISTORY_DAYS);
  const newest = ordered.at(-1);
  if (!newest) return null;
  const plans: PriceSummary['plans'] = {};
  for (const [id, now] of Object.entries(newest.prices)) {
    const seen = ordered.filter((snapshot) => snapshot.prices[id]?.currency === now.currency);
    if (seen.length < 2) continue;
    const previous = seen.at(-2)!;
    let lowest = seen[0];
    let highestMinor = seen[0].prices[id].minor;
    for (const snapshot of seen) {
      if (snapshot.prices[id].minor <= lowest.prices[id].minor) lowest = snapshot;
      highestMinor = Math.max(highestMinor, snapshot.prices[id].minor);
    }
    plans[id] = {
      previousMinor: previous.prices[id].minor,
      previousDate: previous.date,
      lowestMinor: lowest.prices[id].minor,
      lowestDate: lowest.date,
      highestMinor,
      currency: now.currency,
      daysSeen: seen.length,
    };
  }
  return { updatedOn: newest.date, days: ordered.length, plans };
}

export type PriceTrend =
  | { kind: 'dropped'; previousMinor: number; currency: CurrencyCode; since: string }
  | { kind: 'lowest'; days: number };

/** A drop smaller than this is rounding or a cent, not news. */
const MIN_DROP = 0.03;
/** "Lowest in N days" is only said once there are this many days to say it of. */
const MIN_DAYS_FOR_LOWEST = 14;

/**
 * What a card may say about a plan's price today, if anything. A drop since
 * the previous day it was seen comes first; otherwise "the lowest in N days"
 * when today's price is the lowest of at least two weeks of history and was
 * meaningfully higher on some day in them (a price that never moved is not
 * news).
 */
export function trendFor(plan: Plan, summary: PriceSummary | null): PriceTrend | null {
  const history = summary?.plans[plan.id];
  if (!history || history.currency !== plan.sourceCurrency) return null;
  const now = plan.finalPriceMinor;
  if (now <= history.previousMinor * (1 - MIN_DROP)) {
    return { kind: 'dropped', previousMinor: history.previousMinor, currency: history.currency, since: history.previousDate };
  }
  if (history.daysSeen >= MIN_DAYS_FOR_LOWEST && now <= history.lowestMinor && history.highestMinor * (1 - MIN_DROP) >= now) {
    return { kind: 'lowest', days: history.daysSeen };
  }
  return null;
}
