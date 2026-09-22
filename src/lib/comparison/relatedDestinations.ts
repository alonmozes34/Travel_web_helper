import { countries, type Country } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import { isCountryCovered } from './catalogueCoverage';

/**
 * The other destinations worth offering from a country page.
 *
 * Two hundred and fifty destination pages with no links between them are two
 * hundred and fifty pages a crawler reaches only from the sitemap and a
 * reader reaches only by searching again. Both are fixable with data already
 * in the repository, and neither needs a word to be invented: the continent
 * comes from CLDR, "popular" is the editorial list the hero already uses, and
 * whether we can actually sell for a destination is asked of the catalogue.
 *
 * The ordering is deliberate. A neighbour we have plans for is a better
 * suggestion than one we do not, and a destination Israelis actually fly to
 * is a better suggestion than an alphabetical accident — so popularity wins,
 * then coverage, then the reader's own alphabet.
 */
export type RelatedDestination = {
  country: Country;
  /** Whether the current catalogue has anything for it. Shown, not hidden. */
  covered: boolean;
};

export const RELATED_LIMIT = 8;

/**
 * Lower sorts first.
 *
 * Continent alone is far too coarse a signal: it put the Faroe Islands and
 * Åland beside Greece, which is technically the same continent and useless to
 * anybody. The alias list is the better one, and it is already in the
 * repository — a country earns aliases when somebody decided Israeli
 * travellers type its cities, so having them is an editorial statement that
 * people actually go there.
 *
 * Order of preference: a destination on the hero's shortlist, then one people
 * travel to, then one we can actually sell for.
 */
function rank(country: Country): number {
  let score = 0;
  if (!country.popular) score += 4;
  if (country.aliases.length === 0) score += 2;
  if (!isCountryCovered(country.code)) score += 1;
  return score;
}

export function relatedDestinations(
  code: string,
  locale: Locale,
  limit = RELATED_LIMIT,
): RelatedDestination[] {
  const self = countries.find((country) => country.code === code);
  if (!self) return [];

  const sameContinent = countries.filter(
    (country) =>
      country.code !== code &&
      country.continent === self.continent &&
      country.continent !== 'antarctic',
  );

  /**
   * Within a tier, how many aliases a destination carries breaks the tie.
   *
   * It is a proxy, not a measurement: a country earns aliases one at a time,
   * as somebody notices another city travellers type, so the count tracks how
   * much editorial attention a destination has had. Alphabetical order is the
   * alternative and it is worse — sorting Europe by Hebrew name offered
   * Austria, Azerbaijan, Iceland and Estonia to somebody going to Greece,
   * purely because their names begin with alef.
   */
  const byRelevance = (a: Country, b: Country) =>
    rank(a) - rank(b) ||
    b.aliases.length - a.aliases.length ||
    a.names[locale].localeCompare(b.names[locale], locale);

  const chosen = [...sameContinent].sort(byRelevance).slice(0, limit);

  // A continent with almost nothing on it — Oceania, the Caribbean — would
  // otherwise render a short, sad list. Top it up with destinations people
  // actually fly to, rather than leaving the block half empty.
  if (chosen.length < limit) {
    const taken = new Set([code, ...chosen.map((country) => country.code)]);
    const elsewhere = countries
      .filter((country) => country.popular && !taken.has(country.code))
      .sort(byRelevance)
      .slice(0, limit - chosen.length);
    chosen.push(...elsewhere);
  }

  return chosen.map((country) => ({ country, covered: isCountryCovered(country.code) }));
}

/** Every destination on a continent, in the reader's alphabet. */
export function destinationsByContinent(continent: string, locale: Locale): Country[] {
  return countries
    .filter((country) => country.continent === continent)
    .sort((a, b) => a.names[locale].localeCompare(b.names[locale], locale));
}

/** The editorial shortlist the hero already uses, in the reader's alphabet. */
export function popularDestinations(locale: Locale): Country[] {
  return countries
    .filter((country) => country.popular)
    .sort((a, b) => a.names[locale].localeCompare(b.names[locale], locale));
}
