import { countries } from '@/data/countries';
import type { Plan } from '@/lib/types/plan';

/**
 * How much of the world the current catalogue can actually answer for.
 *
 * The destination picker offers every country on the globe, because a
 * traveller should be able to look their destination up and get a straight
 * answer. The catalogue behind it covers rather less, and the site says so
 * with a number rather than by rendering an empty list.
 *
 * Worked out from the plans themselves, on every read of the catalogue —
 * never from a list fixed at build time, which is how a page ends up saying
 * "plans available" for a destination the provider stopped selling.
 */
const sellable = countries.filter((country) => country.continent !== 'antarctic');

export const destinationCount = sellable.length;

export type CatalogueCoverage = {
  coveredCountryCodes: string[];
  coveredCount: number;
  destinationCount: number;
  isCovered: (code: string) => boolean;
};

export function coverageOf(plans: readonly Plan[]): CatalogueCoverage {
  const inPlans = new Set(plans.flatMap((plan) => plan.coverage.countries));
  const coveredCountryCodes = sellable.filter((country) => inPlans.has(country.code)).map((country) => country.code);
  const covered = new Set(coveredCountryCodes);
  return {
    coveredCountryCodes,
    coveredCount: coveredCountryCodes.length,
    destinationCount,
    isCovered: (code) => covered.has(code),
  };
}
