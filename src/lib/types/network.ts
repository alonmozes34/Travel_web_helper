export type NetworkTechnology = '4G' | '5G';

/**
 * Where a coverage rating came from. Ratings are never rendered without their
 * source, and `'mock'` forces a visible demo marker in the UI.
 *
 * Coverage is deliberately NOT an input to V1 recommendations — the
 * architecture is here for Phase 2, when a measurable external source exists.
 */
export type CoverageSource = 'mock' | 'opensignal' | 'operator' | 'gsma';

export type Coverage = {
  /** 1–5. Meaningless without `source`. */
  rating: number;
  source: CoverageSource;
  sourceUrl: string | null;
  measuredAt: string | null;
};

export type Network = {
  /** ISO 3166-1 alpha-2 of the country this operator serves. */
  countryCode: string;
  /** Local operator name, e.g. "AIS". */
  operator: string;
  /** Mobile country/network code, e.g. "520-03". */
  mccMnc: string | null;
  technologies: NetworkTechnology[];
  coverage: Coverage | null;
};

export function hasTechnology(networks: Network[], technology: NetworkTechnology): boolean {
  return networks.some((network) => network.technologies.includes(technology));
}

export function operatorNames(networks: Network[]): string[] {
  return networks.map((network) => network.operator);
}

/**
 * The operators that matter for the destinations being searched.
 *
 * A global plan lists operators in a hundred countries; showing all of them
 * tells a traveller going to Brazil nothing, and showing the Thai one on a
 * Brazilian page is worse than showing nothing. So when we know no operator
 * in the destination, this returns nothing and the page says we do not know.
 * When no destination is given, every operator is returned.
 */
export function networksForDestinations(networks: Network[], countryCodes: string[]): Network[] {
  if (countryCodes.length === 0) return networks;
  return networks.filter((network) => countryCodes.includes(network.countryCode));
}
