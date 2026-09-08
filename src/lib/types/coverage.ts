export type CoverageKind = 'country' | 'region' | 'global';

/**
 * Where a plan works.
 *
 * `countries` is the only thing matching ever reads. A provider's "works in
 * 130 destinations" is kept separately in `publishedDestinationCount` and
 * shown as the provider's claim, because we can only match against
 * destinations we actually hold data for — and telling a traveller a plan
 * covers their country has to be something we can stand behind.
 */
export type PlanCoverage = {
  kind: CoverageKind;
  countries: string[];
  regionId: string | null;
  /** The provider's own figure, displayed as a claim. Never used for matching. */
  publishedDestinationCount: number | null;
};

export function coversCountry(coverage: PlanCoverage, countryCode: string): boolean {
  return coverage.countries.includes(countryCode);
}

/** True only when every destination is covered. */
export function coversAll(coverage: PlanCoverage, countryCodes: string[]): boolean {
  return countryCodes.every((code) => coverage.countries.includes(code));
}

export function coveredCount(coverage: PlanCoverage, countryCodes: string[]): number {
  return countryCodes.filter((code) => coverage.countries.includes(code)).length;
}
