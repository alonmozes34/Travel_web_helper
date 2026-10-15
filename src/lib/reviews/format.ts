import { localeConfig, type Locale } from '@/i18n/config';

/** "ספטמבר 2026" for `2026-09`. */
export function monthLabel(month: string, locale: Locale): string {
  const [year, number] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(localeConfig[locale].intlLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, number - 1, 1)),
  );
}

/** "15.10.2026" for `2026-10-15`, as the site writes dates. */
export function dayLabel(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return `${date}.${month}.${year}`;
}
