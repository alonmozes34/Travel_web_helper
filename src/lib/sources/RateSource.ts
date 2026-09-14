import type { FxRate } from '@/lib/pricing/convert';

/**
 * Where exchange rates come from.
 *
 * The same seam as `ProviderSource`, for the same reason: the conversion layer
 * should not know whether a rate came from a central bank, a commercial feed
 * or a file, and swapping one for another should not touch it.
 *
 * Rates matter more than they look. If the shekel figure is wrong, every
 * price on the site is wrong — including the ones that came from a real
 * provider — and it is wrong quietly, because nothing about the page looks
 * broken. So a rate carries `asOf` and `source` all the way to the interface,
 * which states both, and a source that cannot produce a complete, sane set
 * fails rather than returning a partial one.
 */
export type RateSource = {
  id: string;
  label: string;
  fetch(): Promise<RateResult>;
};

export type RateResult = {
  sourceId: string;
  /** Every pair the application can be asked to convert, or the fetch failed. */
  rates: FxRate[];
  fetchedAt: string;
};
