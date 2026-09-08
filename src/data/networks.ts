import type { Network, NetworkTechnology } from '@/lib/types/network';

/**
 * Local operators per destination.
 *
 * Operator names are public reference data. MCC/MNC codes are given only where
 * they are certain and left null otherwise rather than guessed — an invented
 * network code is still an invented fact, even in a field nobody displays.
 *
 * Coverage ratings are deliberately absent: no rating exists until a
 * measurable external source does, and V1 recommendations never use one.
 */
type OperatorEntry = { mccMnc: string | null; technologies: NetworkTechnology[] };

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
  DE: {
    Telekom: { mccMnc: null, technologies: ['4G', '5G'] },
    'Vodafone DE': { mccMnc: null, technologies: ['4G', '5G'] },
    'O2 DE': { mccMnc: null, technologies: ['4G'] },
  },
  ES: {
    Movistar: { mccMnc: null, technologies: ['4G', '5G'] },
    'Vodafone ES': { mccMnc: null, technologies: ['4G', '5G'] },
    'Orange ES': { mccMnc: null, technologies: ['4G'] },
  },
  GB: {
    EE: { mccMnc: null, technologies: ['4G', '5G'] },
    'Vodafone UK': { mccMnc: null, technologies: ['4G', '5G'] },
    'O2 UK': { mccMnc: null, technologies: ['4G'] },
  },
  NL: {
    KPN: { mccMnc: null, technologies: ['4G', '5G'] },
    Odido: { mccMnc: null, technologies: ['4G'] },
  },
  PT: {
    MEO: { mccMnc: null, technologies: ['4G', '5G'] },
    NOS: { mccMnc: null, technologies: ['4G'] },
  },
  CZ: {
    'T-Mobile CZ': { mccMnc: null, technologies: ['4G', '5G'] },
    'O2 CZ': { mccMnc: null, technologies: ['4G'] },
  },
  CY: {
    Cyta: { mccMnc: null, technologies: ['4G'] },
    Epic: { mccMnc: null, technologies: ['4G'] },
  },
  CA: {
    Rogers: { mccMnc: null, technologies: ['4G', '5G'] },
    Telus: { mccMnc: null, technologies: ['4G'] },
  },
  VN: {
    Viettel: { mccMnc: null, technologies: ['4G'] },
    Vinaphone: { mccMnc: null, technologies: ['4G'] },
  },
  IN: {
    Jio: { mccMnc: null, technologies: ['4G', '5G'] },
    Airtel: { mccMnc: null, technologies: ['4G'] },
  },
  AU: {
    Telstra: { mccMnc: null, technologies: ['4G', '5G'] },
    Optus: { mccMnc: null, technologies: ['4G'] },
  },
  TR: {
    Turkcell: { mccMnc: null, technologies: ['4G', '5G'] },
    'Vodafone TR': { mccMnc: null, technologies: ['4G'] },
  },
  GE: {
    Magti: { mccMnc: null, technologies: ['4G'] },
    Silknet: { mccMnc: null, technologies: ['4G'] },
  },
  AE: {
    Etisalat: { mccMnc: null, technologies: ['4G', '5G'] },
    du: { mccMnc: null, technologies: ['4G'] },
  },
};

/**
 * Build the network list for a plan in one country. `technologies` narrows
 * what the plan actually enables — a 4G-only plan on a 5G operator is common.
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
      countryCode,
      operator,
      mccMnc: entry?.mccMnc ?? null,
      technologies: technologies
        ? available.filter((technology) => technologies.includes(technology))
        : available,
      coverage: null,
    };
  });
}

/**
 * Networks for a multi-country plan: the primary operator in each covered
 * country we hold data for. Countries we have no operator data for are simply
 * omitted rather than filled in with a guess.
 */
export function buildRegionalNetworks(
  countryCodes: string[],
  technologies?: NetworkTechnology[],
): Network[] {
  return countryCodes.flatMap((countryCode) => {
    const catalogue = operatorsByCountry[countryCode];
    if (!catalogue) return [];
    const [primary] = Object.keys(catalogue);
    return primary ? buildNetworks(countryCode, [primary], technologies) : [];
  });
}
