import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

export type NavLink = { href: string; label: string };

/**
 * Main navigation. "How it works" and the FAQ are sections of the homepage
 * rather than separate pages — one less hop between a visitor and the results.
 */
export function mainNavLinks(locale: Locale, dict: Dictionary): NavLink[] {
  const home = localePath(locale, '/');
  return [
    { href: home, label: dict.nav.compare },
    { href: `${home === '/' ? '' : home}/#how-it-works`, label: dict.nav.howItWorks },
    { href: `${home === '/' ? '' : home}/#faq`, label: dict.nav.faq },
  ];
}
