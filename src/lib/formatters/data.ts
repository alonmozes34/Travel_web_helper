import { localeConfig, type Locale } from '@/i18n/config';

export const MB_PER_GB = 1024;

/**
 * Data allowances are stored in MB internally and only ever converted to GB
 * for display, so a 500MB plan and a 20GB plan stay comparable in one unit.
 */
export function formatData(amountMb: number, locale: Locale): string {
  const intlLocale = localeConfig[locale].intlLocale;

  if (amountMb < MB_PER_GB) {
    return `${new Intl.NumberFormat(intlLocale).format(amountMb)}MB`;
  }

  const gb = amountMb / MB_PER_GB;
  const formatted = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: Number.isInteger(gb) ? 0 : 1,
  }).format(gb);

  return `${formatted}GB`;
}

export function toGb(amountMb: number): number {
  return amountMb / MB_PER_GB;
}
