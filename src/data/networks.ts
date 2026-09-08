import type { Network, NetworkTechnology } from '@/lib/types/network';

/**
 * Local operators per destination.
 *
 * Operator names and MCC/MNC codes are public reference data. Coverage
 * ratings are NOT stored here: no rating exists until a measurable external
 * source does, and V1 recommendations never use one.
 */
type OperatorEntry = { mccMnc: string; technologies: NetworkTechnology[] };

export const operatorsByCountry: Record<string, Record<string, OperatorEntry>> = {
  TH: {
    AIS: { mccMnc: '520-03', technologies: ['4G', '5G'] },
    True: { mccMnc: '520-04', technologies: ['4G', '5G'] },
    dtac: { mccMnc: '520-18', technologies: ['4G'] },
  },
  FR: {
    Orange: { mccMnc: '208-01', technologies: ['4G', '5G'] },
    SFR: { mccMnc: '208-10', technologies: ['4G', '5G'] },
    Bouygues: { mccMnc: '208-20', technologies: ['4G'] },
  },
  US: {
    'T-Mobile': { mccMnc: '310-260', technologies: ['4G', '5G'] },
    'AT&T': { mccMnc: '310-410', technologies: ['4G', '5G'] },
  },
  GR: {
    Cosmote: { mccMnc: '202-01', technologies: ['4G', '5G'] },
    'Vodafone GR': { mccMnc: '202-05', technologies: ['4G', '5G'] },
    Nova: { mccMnc: '202-10', technologies: ['4G'] },
  },
  IT: {
    TIM: { mccMnc: '222-01', technologies: ['4G', '5G'] },
    'Vodafone IT': { mccMnc: '222-10', technologies: ['4G', '5G'] },
    WindTre: { mccMnc: '222-88', technologies: ['4G'] },
  },
  JP: {
    'NTT Docomo': { mccMnc: '440-10', technologies: ['4G', '5G'] },
    SoftBank: { mccMnc: '440-20', technologies: ['4G', '5G'] },
    KDDI: { mccMnc: '440-50', technologies: ['4G'] },
  },
};

/**
 * Build the network list for a plan. `technologies` narrows what the plan
 * actually enables — a 4G-only plan on a 5G operator is common.
 */
export function buildNetworks(
  countryCode: string,
  operators: string[],
  technologies?: NetworkTechnology[],
): Network[] {
  const catalogue = operatorsByCountry[countryCode] ?? {};

  return operators.map((operator) => {
    const entry = catalogue[operator];
    const available = entry?.technologies ?? ['4G'];
    return {
      operator,
      mccMnc: entry?.mccMnc ?? null,
      technologies: technologies
        ? available.filter((technology) => technologies.includes(technology))
        : available,
      coverage: null,
    };
  });
}
