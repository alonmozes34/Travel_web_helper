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
