import { rentalDays } from './query';
import { demoRentalSource } from './sources/demo';
import { discoverCarsSource, ofranSource } from './sources/affiliateNetwork';
import type { RentalOffer, RentalQuery, RentalSource, SkippedOffer } from './types';

/**
 * Every rental network the code knows about, configured or not.
 *
 * Order is the order they are listed in, not a ranking: the results are
 * sorted by price afterwards, and a network never buys a position. That is
 * the same rule the eSIM catalogue runs under, and it holds here for the same
 * reason — `RentalOffer` has no commission field, so the sort could not see
 * one even if somebody wanted it to.
 */
export const rentalSources: readonly RentalSource[] = [
  discoverCarsSource,
  ofranSource,
  demoRentalSource,
];

/**
 * Whether to ask an eSIM buyer about a rental car at all.
 *
 * Yes: since 6 October 2026 the answer opens Booking.com's car pages for the
 * destination (`bookingLink`), which is a real place to rent a car. The
 * question still stays away where no Booking link can be made — the callers
 * check that per country.
 */
export function carRentalOfferEnabled(): boolean {
  return true;
}

/**
 * Whether the site's own rental comparison page may be shown.
 *
 * Only with a real rental network connected, or on the demo catalogue the
 * test suites run on. Booking's terms forbid comparing their cars with
 * anyone else's, so Booking is not one of these networks, and a page of
 * invented demo offers is never shown to a real visitor.
 */
export function rentalComparisonEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.DEMO_CATALOGUE === 'true') return true;
  return configuredRentalSources().some((source) => source.id !== demoRentalSource.id);
}

export function configuredRentalSources(
  sources: readonly RentalSource[] = rentalSources,
): RentalSource[] {
  return sources.filter((source) => source.isConfigured());
}

export type RentalSearchSummary = {
  offers: RentalOffer[];
  skipped: SkippedOffer[];
  /** Which networks answered, so a page can say where its rows came from. */
  sourceIds: string[];
  /** True while every row on the page is demo data. */
  allDemo: boolean;
  /** True when demo and real rows share the page, so each row is marked. */
  mixed: boolean;
  searchedAt: string;
};

/**
 * Ask every configured network and merge the answers.
 *
 * A network that throws is dropped rather than taking the page down with it:
 * one broker having a bad afternoon should cost the traveller that broker's
 * rows, not their search.
 */
export async function searchRentals(
  query: RentalQuery,
  sources: readonly RentalSource[] = rentalSources,
): Promise<RentalSearchSummary> {
  const active = configuredRentalSources(sources);
  const settled = await Promise.allSettled(active.map((source) => source.search(query)));

  const offers: RentalOffer[] = [];
  const skipped: SkippedOffer[] = [];
  const sourceIds: string[] = [];

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    offers.push(...result.value.offers);
    skipped.push(...result.value.skipped);
    if (result.value.offers.length > 0) sourceIds.push(result.value.sourceId);
  }

  offers.sort((a, b) => a.totalPriceMinor - b.totalPriceMinor);

  const demoCount = offers.filter((offer) => offer.source === 'demo').length;

  return {
    offers,
    skipped,
    sourceIds,
    // `every` on an empty list is true, which would describe a page with no
    // cars as entirely invented. Guarded, as it is on the eSIM side.
    allDemo: offers.length > 0 && demoCount === offers.length,
    mixed: demoCount > 0 && demoCount < offers.length,
    searchedAt: new Date().toISOString(),
  };
}

/** The rental length the whole page agrees on. */
export function summaryDays(query: RentalQuery): number {
  return rentalDays(query);
}
