import type { Alert } from './alerts';
import { bookingStepLabels, countryLabel, providerLabel, shortDay, sourceLabels } from './labels';
import { breakdown, bookingOut, percent, total, type Period } from './summary';

/**
 * The weekly summary email, sent on Sundays (the owner, 13 October 2026), and
 * the alert email. Plain text: it is read on a phone, and a figure in a
 * sentence survives every mail client.
 */

const number = new Intl.NumberFormat('he-IL');

const change = (now: number, before: number) => {
  if (before === 0) return now === 0 ? '' : ' (בשבוע הקודם: 0)';
  const delta = Math.round(((now - before) / before) * 100);
  return ` (${delta >= 0 ? '+' : ''}${delta}% מול השבוע הקודם, ${number.format(before)})`;
};

const top = (period: Period, prefix: string, label: (key: string) => string, count = 5) =>
  breakdown(period, prefix)
    .slice(0, count)
    .map((row) => `  · ${label(row.key)}: ${number.format(row.count)}`);

export function weeklyEmail({
  week,
  before,
  alerts,
  dashboardUrl,
}: {
  week: Period;
  before: Period;
  alerts: readonly Alert[];
  dashboardUrl: string;
}): { subject: string; text: string } {
  const range = `${shortDay(week.days[0])}–${shortDay(week.days.at(-1)!)}`;
  const visits = total(week, 'visits');
  const searches = total(week, 'searches');
  const clicks = total(week, 'clicks');
  const zero = breakdown(week, 'zero:').reduce((sum, row) => sum + row.count, 0);

  const lines = [
    `סיכום שבועי, ${range}`,
    '',
    `כניסות לאתר: ${number.format(visits)}${change(visits, total(before, 'visits'))}`,
    `צפיות בעמודים: ${number.format(total(week, 'views'))}`,
    `חיפושים: ${number.format(searches)}${change(searches, total(before, 'searches'))}${zero ? `, מתוכם ${number.format(zero)} בלי אף תוצאה` : ''}`,
    `לחיצות לספקים: ${number.format(clicks)}${change(clicks, total(before, 'clicks'))}`,
    ...top(week, 'click:', providerLabel, 10),
    percent(clicks, searches) === null ? '' : `מכל 100 חיפושים יצאו ${percent(clicks, searches)} לחיצות לספק.`,
    '',
    `Booking.com: ${number.format(bookingOut(week))} לחיצות`,
    `  · ${bookingStepLabels.hotels}: ${number.format(total(week, 'booking:hotels'))}`,
    `  · ${bookingStepLabels.cars}: ${number.format(total(week, 'booking:cars'))}`,
    `  · ${bookingStepLabels.attractions}: ${number.format(total(week, 'booking:attractions'))}`,
    `  · ${bookingStepLabels['page-hotels']}: ${number.format(total(week, 'booking:page-hotels'))}`,
    `  · ${bookingStepLabels['page-cars']}: ${number.format(total(week, 'booking:page-cars'))}`,
    `  · ${bookingStepLabels['page-attractions']}: ${number.format(total(week, 'booking:page-attractions'))}`,
    '',
    'היעדים שחיפשו הכי הרבה:',
    ...top(week, 'search:', countryLabel),
    '',
    'מאיפה הגיעו:',
    ...top(week, 'from:', (key) => sourceLabels[key] ?? key),
    '',
    `הודעות מ"צור קשר": ${number.format(breakdown(week, 'contact:').reduce((sum, row) => sum + row.count, 0))} · שליחות בוואטסאפ: ${number.format(total(week, 'share:whatsapp'))}`,
    '',
    alerts.length ? 'התרעות פתוחות:' : 'אין התרעות פתוחות.',
    ...alerts.map((alert) => `  · ${alert.text}`),
    '',
    `הלוח המלא: ${dashboardUrl}`,
    'העמלות עצמן מופיעות בלוח השותפים של כל תוכנית; הן לא נמשכות לכאן.',
  ];
  return { subject: `[יש קליטה?] סיכום שבועי ${range}: ${number.format(visits)} כניסות, ${number.format(clicks)} לחיצות`, text: lines.join('\n') };
}

export function alertEmail({ alerts, dashboardUrl }: { alerts: readonly Alert[]; dashboardUrl: string }): { subject: string; text: string } {
  return {
    subject: `[יש קליטה?] ${alerts.length === 1 ? 'התרעה' : `${alerts.length} התרעות`}: ${alerts[0]?.text.slice(0, 60) ?? ''}`,
    text: [
      ...alerts.map((alert) => `· ${alert.text}`),
      '',
      `הלוח: ${dashboardUrl}`,
      'כל התרעה נשלחת פעם אחת, ושוב רק אם היא עדיין נכונה אחרי שלושה ימים.',
    ].join('\n'),
  };
}
