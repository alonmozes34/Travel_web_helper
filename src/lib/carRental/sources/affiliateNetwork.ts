import type { RentalSearchResult, RentalSource } from '../types';

/**
 * Adapters for the networks we have applied to but cannot yet query.
 *
 * They exist as real registry entries rather than as a comment, because the
 * thing being proved is that the UI is not built around one network: adding
 * DiscoverCars means filling in `search` here and setting one environment
 * variable, with no change to the page, the form or the results list.
 *
 * `isConfigured` is the whole mechanism. An adapter without credentials is
 * never queried and never contributes a row, so a half-finished integration
 * cannot leak an empty state onto the page. Nothing here guesses at an API
 * shape we have not been given: until the credentials and the documentation
 * arrive, `search` refuses rather than inventing a request.
 */

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function notConfigured(sourceId: string): Promise<RentalSearchResult> {
  return Promise.resolve({
    sourceId,
    offers: [],
    skipped: [],
    searchedAt: new Date().toISOString(),
  });
}

/**
 * DiscoverCars. Their affiliate programme supplies a feed; the request shape
 * goes in once we hold the credentials, and not before.
 */
export const discoverCarsSource: RentalSource = {
  id: 'discovercars',
  label: 'DiscoverCars',
  isConfigured: () => configured('DISCOVERCARS_API_KEY'),
  async search() {
    return notConfigured('discovercars');
  },
};

/** Ofran, the Israeli broker. Same rule. */
export const ofranSource: RentalSource = {
  id: 'ofran',
  label: 'Ofran',
  isConfigured: () => configured('OFRAN_API_KEY'),
  async search() {
    return notConfigured('ofran');
  },
};
