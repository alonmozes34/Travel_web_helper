import { cookies } from 'next/headers';
import { CURRENCY_COOKIE, isCurrency, localeConfig, type CurrencyCode, type Locale } from '@/i18n/config';

/**
 * The display currency for a server-rendered page.
 *
 * Reading the cookie makes the route dynamic, so this is only called on pages
 * that actually render prices — the homepage stays static.
 */
export async function getDisplayCurrency(locale: Locale): Promise<CurrencyCode> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  if (value && isCurrency(value)) return value;
  return localeConfig[locale].defaultCurrency;
}
