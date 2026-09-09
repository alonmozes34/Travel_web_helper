import { countries } from '@/data/countries';
import { getPlansForCountry } from '@/data/mockPlans';

/**
 * How much of the world the current catalogue can actually answer for.
 *
 * The destination picker offers every country on the globe, because a
 * traveller should be able to look their destination up and get a straight
 * answer. The catalogue behind it covers rather less, and the site says so
 * with a number rather than by rendering an empty list.
 */
const sellable = countries.filter((country) => country.continent !== 'antarctic');

export const destinationCount = sellable.length;

export const coveredCountryCodes: string[] = sellable
  .filter((country) => getPlansForCountry(country.code).length > 0)
  .map((country) => country.code);

export const coveredCount = coveredCountryCodes.length;

const covered = new Set(coveredCountryCodes);

export function isCountryCovered(code: string): boolean {
  return covered.has(code);
}
