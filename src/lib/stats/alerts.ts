import { getCountryByCode } from '@/data/countries';
import { getProvider } from '@/data/providers';
import { periodOf, type DayCounts } from './summary';

/**
 * What is worth an email the same day (the owner, 13 October 2026: "alerts").
 *
 * Each rule waits for enough traffic to mean something: before launch a quiet
 * day is normal, and an alert that fires on nothing teaches its reader to
 * ignore it. The thresholds are here, in one place, to be tuned once real
 * traffic shows what normal is.
 */
export const ALERT_RULES = {
  /** A listed provider with no click in this many full days… */
  quietDays: 3,
  /** …while the site as a whole sent at least this many clicks in them. */
  quietMinClicks: 15,
  /** Yesterday's visits below this share of the week before's average… */
  dropShare: 0.3,
  /** …when that average was at least this many visits a day. */
  dropMinAverage: 20,
  /** Pages not found in a day: something links to a broken address. */
  notFoundPerDay: 20,
  /** The same trip with no answer this many times in a week. */
  zeroResultsPerWeek: 5,
  /** An alert already sent is not repeated for this many days. */
  repeatAfterDays: 3,
} as const;

export type Alert = { key: string; text: string };

export type SourceState = { id: string; label: string; ok: boolean; error: string | null };

const countryName = (code: string) => getCountryByCode(code)?.names.he ?? code;
const providerName = (id: string) => getProvider(id)?.name ?? id;

/**
 * The alerts that hold now. `days` are the full days to judge, oldest first,
 * ending yesterday (Israel) — today is still being counted.
 */
export function alertsFor({
  data,
  days,
  sources,
  listedProviders,
}: {
  data: DayCounts;
  days: readonly string[];
  sources: readonly SourceState[];
  listedProviders: readonly string[];
}): Alert[] {
  const alerts: Alert[] = [];

  for (const source of sources) {
    // A source on its first read on a new server is slow, not down.
    if (!source.ok && !/still loading/i.test(source.error ?? '')) {
      alerts.push({ key: `source:${source.id}`, text: `${source.label} לא נטען באתר. ${source.error ?? ''}`.trim() });
    }
  }

  const recent = periodOf(data, days.slice(-ALERT_RULES.quietDays));
  const recentClicks = recent.totals.clicks ?? 0;
  if (recentClicks >= ALERT_RULES.quietMinClicks) {
    for (const id of listedProviders) {
      if (!recent.totals[`click:${id}`]) {
        alerts.push({
          key: `quiet:${id}`,
          text: `אף לחיצה ל־${providerName(id)} ב־${ALERT_RULES.quietDays} הימים האחרונים, מתוך ${recentClicks} לחיצות לספקים. כדאי לבדוק שהחבילות שלהם מוצגות ושהקישורים עובדים.`,
        });
      }
    }
  }

  const yesterday = days.at(-1);
  const before = days.slice(-8, -1);
  if (yesterday && before.length > 0) {
    const average = before.reduce((sum, day) => sum + (data[day]?.visits ?? 0), 0) / before.length;
    const visits = data[yesterday]?.visits ?? 0;
    if (average >= ALERT_RULES.dropMinAverage && visits < average * ALERT_RULES.dropShare) {
      alerts.push({
        key: 'drop',
        text: `אתמול נכנסו ${visits} מבקרים, לעומת ממוצע של ${Math.round(average)} ביום בשבוע שלפניו. כדאי לבדוק שהאתר עולה.`,
      });
    }
    const notFound = data[yesterday]?.['page:404'] ?? 0;
    if (notFound >= ALERT_RULES.notFoundPerDay) {
      alerts.push({
        key: '404',
        text: `אתמול ${notFound} כניסות הגיעו לעמוד שלא קיים (404). כנראה קישור שבור מאתר אחר או מהאתר עצמו.`,
      });
    }
  }

  const week = periodOf(data, days.slice(-7));
  for (const [name, times] of Object.entries(week.totals)) {
    if (!name.startsWith('zero:') || times < ALERT_RULES.zeroResultsPerWeek) continue;
    const trip = name.slice('zero:'.length).split('+').map(countryName).join(' + ');
    alerts.push({ key: name, text: `${times} חיפושים השבוע ל־${trip} לא מצאו אף חבילה.` });
  }

  return alerts;
}

/** Alerts not already sent in the last few days (`alert:<key>` marks the day one went out). */
export function notYetSent(alerts: readonly Alert[], data: DayCounts, days: readonly string[]): Alert[] {
  const window = days.slice(-ALERT_RULES.repeatAfterDays);
  return alerts.filter((alert) => !window.some((day) => data[day]?.[`alert:${alert.key}`]));
}
