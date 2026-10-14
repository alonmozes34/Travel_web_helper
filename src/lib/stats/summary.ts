/**
 * The day's counters, added up for a period — what the dashboard, the weekly
 * email and the alerts all read. Pure arithmetic over `StatsStore.read`.
 */

export type DayCounts = Record<string, Record<string, number>>;

/** Booking links followed, from the card after a plan and from a country's page. */
export const BOOKING_OUT = [
  'booking:hotels',
  'booking:cars',
  'booking:attractions',
  'booking:page-hotels',
  'booking:page-cars',
  'booking:page-attractions',
] as const;

export type Period = {
  days: string[];
  totals: Record<string, number>;
  /** One row a day, oldest first, with the figures the daily table shows. */
  daily: Array<{ day: string; visits: number; views: number; searches: number; clicks: number; booking: number }>;
};

/** Every counter added up over `days`. Names the store keeps for itself (`alert:`, `email:`) are left out. */
export function periodOf(data: DayCounts, days: readonly string[]): Period {
  const totals: Record<string, number> = {};
  const daily: Period['daily'] = [];
  for (const day of days) {
    const counts = data[day] ?? {};
    for (const [name, value] of Object.entries(counts)) {
      if (isBookkeeping(name)) continue;
      totals[name] = (totals[name] ?? 0) + value;
    }
    daily.push({
      day,
      visits: counts.visits ?? 0,
      views: counts.views ?? 0,
      searches: counts.searches ?? 0,
      clicks: counts.clicks ?? 0,
      booking: BOOKING_OUT.reduce((sum, name) => sum + (counts[name] ?? 0), 0),
    });
  }
  return { days: [...days], totals, daily };
}

const isBookkeeping = (name: string) => name.startsWith('alert:') || name.startsWith('email:');

/** A counter's total, 0 when never counted. */
export const total = (period: Period, name: string) => period.totals[name] ?? 0;

export const bookingOut = (period: Period) => BOOKING_OUT.reduce((sum, name) => sum + total(period, name), 0);

/**
 * The counters under one prefix, largest first: `breakdown(p, 'click:')` is
 * clicks by provider (`click:saily` → `saily`), and leaves out the deeper
 * `click:saily:JP`; `breakdown(p, 'click:saily:')` is that provider's clicks
 * by destination.
 */
export function breakdown(period: Period, prefix: string): Array<{ key: string; count: number }> {
  return Object.entries(period.totals)
    .filter(([name, value]) => name.startsWith(prefix) && !name.slice(prefix.length).includes(':') && value > 0)
    .map(([name, count]) => ({ key: name.slice(prefix.length), count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** A share as a whole percentage, or null when there is nothing to divide by. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}
