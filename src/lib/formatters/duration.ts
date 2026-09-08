import { localeConfig, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

/** "30 ימים" / "1 יום" — the unit noun comes from the dictionary. */
export function formatDuration(days: number, locale: Locale, dict: Dictionary): string {
  const value = new Intl.NumberFormat(localeConfig[locale].intlLocale).format(days);
  return `${value} ${days === 1 ? dict.units.day : dict.units.days}`;
}
