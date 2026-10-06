import type { Locale } from '@/i18n/config';

/**
 * Booking.com, through CJ (approved 6 October 2026).
 *
 * Booking allow deep links and their search widget, and forbid "meta
 * comparison" — showing their inventory or prices next to other providers'.
 * So the site never shows a Booking price: it links to Booking's own page for
 * the destination, and the visitor searches there.
 *
 * The link is CJ's deep-link form, `/links/<site>/type/dlg/<page>`. Checked by
 * hand on 6 October 2026: CJ forwards to the page with Booking's affiliate id
 * (`aid=8133101`) and a label naming this site, and Booking then shows the
 * clean page. The older `click-<site>-<link>?url=` form ignored the page and
 * opened the cars homepage; a page address carrying its own query string
 * (`searchresults.html?ss=…`) lost the query or ended in a 404 — hence the
 * country pages, which need none.
 *
 * Only a booking finished in the same visit earns a commission: Booking set
 * no cookie for later. Both ids are public — they are in every link.
 */
export const BOOKING_CJ = {
  /** Our website id in CJ ("Yesh Klita – Travel eSIM Comparison"). */
  site: '101892359',
  host: 'https://www.tkqlhce.com',
} as const;

export type BookingKind = 'hotels' | 'cars';

const LANGUAGE: Record<Locale, string> = { he: 'he', en: 'en-gb' };

/** Booking's own page for a country: its hotels, or its car rental. */
export function bookingPage(kind: BookingKind, countryCode: string, locale: Locale): string {
  const cc = countryCode.toLowerCase();
  const lang = LANGUAGE[locale];
  return kind === 'hotels'
    ? `https://www.booking.com/country/${cc}.${lang}.html`
    : `https://www.booking.com/cars/country/${cc}.${lang}.html`;
}

/**
 * The affiliate link to that page, or null where there is no sense in one:
 * Israel (the traveller lives there) and anything that is not a country code.
 */
export function bookingLink(kind: BookingKind, countryCode: string | undefined, locale: Locale): string | null {
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode) || countryCode === 'IL') return null;
  return `${BOOKING_CJ.host}/links/${BOOKING_CJ.site}/type/dlg/${bookingPage(kind, countryCode, locale)}`;
}
