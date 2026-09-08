import type { CurrencyCode } from '@/i18n/config';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { NetworkTechnology } from '@/lib/types/network';
import type { Plan } from '@/lib/types/plan';
import { buildNetworks } from './networks';

/**
 * MOCK PLAN DATA — NOT REAL OFFERS.
 *
 * Every record carries `source: 'mock'`, every discount carries
 * `source: 'mock'`, and `lastUpdatedAt` is null because no real feed has
 * supplied one. Prices, allowances and coupon codes here were invented for
 * design and development, and the UI marks any screen that renders them.
 *
 * Provider names and local operator names are real; the commercial terms
 * attached to them are not.
 */
export const MOCK_PLANS_GENERATED_AT = '2026-09-01';

type PlanSeed = {
  provider: string;
  name: string;
  country: string;
  /** Allowance in GB. Omit for unlimited plans. */
  gb?: number;
  unlimited?: boolean;
  /** [full-speed GB per day, throttled kbps] */
  fup?: [number, number];
  days: number;
  currency: CurrencyCode;
  /** Price in major units, e.g. 18.2 for $18.20. */
  price: number;
  /** Price before discount, in major units. */
  was?: number;
  code?: string;
  percent?: number;
  operators: string[];
  technologies?: NetworkTechnology[];
  hotspot?: boolean;
  calls?: boolean;
  sms?: boolean;
  topUp?: boolean;
};

function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

function buildPlan(seed: PlanSeed, index: number): Plan {
  const finalPriceMinor = toMinor(seed.price);
  const originalPriceMinor = seed.was ? toMinor(seed.was) : finalPriceMinor;

  return {
    id: `${seed.provider}-${seed.country.toLowerCase()}-${index}`,
    providerId: seed.provider,
    planName: seed.name,
    countryCode: seed.country,
    region: null,
    dataAmountMb: seed.unlimited ? 0 : Math.round((seed.gb ?? 0) * MB_PER_GB),
    isUnlimited: Boolean(seed.unlimited),
    fairUsage: seed.fup
      ? { dailyThresholdMb: Math.round(seed.fup[0] * MB_PER_GB), throttledToKbps: seed.fup[1] }
      : null,
    validityDays: seed.days,
    sourceCurrency: seed.currency,
    originalPriceMinor,
    finalPriceMinor,
    discount:
      seed.code && seed.percent
        ? { code: seed.code, percent: seed.percent, source: 'mock' }
        : null,
    networks: buildNetworks(seed.country, seed.operators, seed.technologies),
    hotspot: seed.hotspot ?? true,
    calls: seed.calls ?? false,
    sms: seed.sms ?? false,
    topUp: seed.topUp ?? true,
    affiliateUrl: null,
    source: 'mock',
    lastUpdatedAt: null,
  };
}

const seeds: PlanSeed[] = [
  // ---------------------------------------------------------------- Thailand
  { provider: 'airalo', name: 'Discover Thailand 20GB', country: 'TH', gb: 20, days: 30, currency: 'USD', price: 18.2, was: 22.0, code: 'TRAVEL10', percent: 17, operators: ['AIS'] },
  { provider: 'airalo', name: 'Discover Thailand 5GB', country: 'TH', gb: 5, days: 30, currency: 'USD', price: 9.5, operators: ['AIS'] },
  { provider: 'saily', name: 'Thailand 5GB', country: 'TH', gb: 5, days: 30, currency: 'USD', price: 9.99, operators: ['dtac'], technologies: ['4G'] },
  { provider: 'saily', name: 'Thailand 10GB', country: 'TH', gb: 10, days: 30, currency: 'USD', price: 15.99, operators: ['dtac'], technologies: ['4G'] },
  { provider: 'nomad', name: 'Thailand 10GB', country: 'TH', gb: 10, days: 30, currency: 'USD', price: 12.5, operators: ['True'] },
  { provider: 'ubigi', name: 'Thailand 10GB', country: 'TH', gb: 10, days: 30, currency: 'EUR', price: 13.0, operators: ['AIS', 'True'], sms: true },
  { provider: 'alosim', name: 'Thailand 3GB', country: 'TH', gb: 3, days: 15, currency: 'USD', price: 8.5, operators: ['AIS'], technologies: ['4G'] },
  { provider: 'holafly', name: 'Thailand Unlimited', country: 'TH', unlimited: true, fup: [5, 512], days: 15, currency: 'USD', price: 64.0, operators: ['AIS'], technologies: ['4G'], hotspot: false, topUp: false },
  { provider: 'yesim', name: 'Thailand Unlimited 7', country: 'TH', unlimited: true, fup: [2, 512], days: 7, currency: 'EUR', price: 29.0, operators: ['True'], technologies: ['4G'], topUp: false },

  // ------------------------------------------------------------------ France
  { provider: 'airalo', name: 'Eurolink France 10GB', country: 'FR', gb: 10, days: 30, currency: 'USD', price: 16.0, operators: ['Orange'] },
  { provider: 'saily', name: 'France 5GB', country: 'FR', gb: 5, days: 30, currency: 'USD', price: 8.99, operators: ['SFR'], technologies: ['4G'] },
  { provider: 'nomad', name: 'France 10GB', country: 'FR', gb: 10, days: 30, currency: 'USD', price: 14.0, operators: ['Orange'] },
  { provider: 'ubigi', name: 'France 10GB', country: 'FR', gb: 10, days: 30, currency: 'EUR', price: 11.0, operators: ['Orange', 'SFR'], sms: true },
  { provider: 'alosim', name: 'France 3GB', country: 'FR', gb: 3, days: 30, currency: 'USD', price: 8.0, operators: ['Bouygues'], technologies: ['4G'] },
  { provider: 'maya', name: 'France 20GB', country: 'FR', gb: 20, days: 30, currency: 'USD', price: 22.0, was: 26.0, code: 'MAYA15', percent: 15, operators: ['Orange', 'SFR'] },
  { provider: 'holafly', name: 'France Unlimited', country: 'FR', unlimited: true, fup: [5, 512], days: 10, currency: 'USD', price: 47.0, operators: ['Orange'], technologies: ['4G'], hotspot: false, topUp: false },

  // --------------------------------------------------------------------- USA
  { provider: 'airalo', name: 'Change USA 10GB', country: 'US', gb: 10, days: 30, currency: 'USD', price: 26.0, operators: ['T-Mobile'] },
  { provider: 'saily', name: 'United States 10GB', country: 'US', gb: 10, days: 30, currency: 'USD', price: 21.99, operators: ['AT&T'] },
  { provider: 'nomad', name: 'United States 10GB', country: 'US', gb: 10, days: 30, currency: 'USD', price: 19.0, was: 23.0, code: 'NOMAD17', percent: 17, operators: ['T-Mobile'] },
  { provider: 'ubigi', name: 'United States 10GB', country: 'US', gb: 10, days: 30, currency: 'EUR', price: 17.0, operators: ['T-Mobile', 'AT&T'], sms: true },
  { provider: 'alosim', name: 'United States 5GB', country: 'US', gb: 5, days: 7, currency: 'USD', price: 14.0, operators: ['AT&T'], technologies: ['4G'] },
  { provider: 'maya', name: 'United States 20GB', country: 'US', gb: 20, days: 30, currency: 'USD', price: 32.0, operators: ['T-Mobile'] },
  { provider: 'holafly', name: 'United States Unlimited', country: 'US', unlimited: true, fup: [5, 512], days: 15, currency: 'USD', price: 57.0, operators: ['T-Mobile'], technologies: ['4G'], hotspot: false, topUp: false },

  // ------------------------------------------------------------------ Greece
  { provider: 'airalo', name: 'Hellas Mobile 5GB', country: 'GR', gb: 5, days: 30, currency: 'USD', price: 11.5, operators: ['Cosmote'] },
  { provider: 'saily', name: 'Greece 5GB', country: 'GR', gb: 5, days: 30, currency: 'USD', price: 9.49, operators: ['Vodafone GR'], technologies: ['4G'] },
  { provider: 'nomad', name: 'Greece 10GB', country: 'GR', gb: 10, days: 30, currency: 'USD', price: 13.0, operators: ['Cosmote'] },
  { provider: 'ubigi', name: 'Greece 10GB', country: 'GR', gb: 10, days: 30, currency: 'EUR', price: 12.0, operators: ['Cosmote', 'Vodafone GR'], sms: true },
  { provider: 'maya', name: 'Greece 20GB', country: 'GR', gb: 20, days: 30, currency: 'USD', price: 21.0, operators: ['Cosmote'] },
  { provider: 'holafly', name: 'Greece Unlimited', country: 'GR', unlimited: true, fup: [5, 512], days: 10, currency: 'USD', price: 44.0, operators: ['Cosmote'], technologies: ['4G'], hotspot: false, topUp: false },

  // ------------------------------------------------------------------- Italy
  { provider: 'airalo', name: 'Mamma Mia 10GB', country: 'IT', gb: 10, days: 30, currency: 'USD', price: 16.5, operators: ['TIM'] },
  { provider: 'saily', name: 'Italy 10GB', country: 'IT', gb: 10, days: 30, currency: 'USD', price: 14.99, operators: ['Vodafone IT'] },
  { provider: 'nomad', name: 'Italy 5GB', country: 'IT', gb: 5, days: 30, currency: 'USD', price: 9.5, operators: ['TIM'] },
  { provider: 'ubigi', name: 'Italy 10GB', country: 'IT', gb: 10, days: 30, currency: 'EUR', price: 11.5, operators: ['TIM', 'Vodafone IT'], sms: true },
  { provider: 'maya', name: 'Italy 20GB', country: 'IT', gb: 20, days: 30, currency: 'USD', price: 23.0, operators: ['WindTre'], technologies: ['4G'] },
  { provider: 'yesim', name: 'Italy Unlimited 7', country: 'IT', unlimited: true, fup: [2, 512], days: 7, currency: 'EUR', price: 26.0, operators: ['TIM'], technologies: ['4G'], topUp: false },

  // ------------------------------------------------------------------- Japan
  { provider: 'airalo', name: 'Moshi Moshi 10GB', country: 'JP', gb: 10, days: 30, currency: 'USD', price: 18.5, operators: ['NTT Docomo'] },
  { provider: 'saily', name: 'Japan 10GB', country: 'JP', gb: 10, days: 30, currency: 'USD', price: 17.99, operators: ['SoftBank'] },
  { provider: 'nomad', name: 'Japan 10GB', country: 'JP', gb: 10, days: 30, currency: 'USD', price: 17.0, operators: ['NTT Docomo'] },
  { provider: 'ubigi', name: 'Japan 10GB', country: 'JP', gb: 10, days: 30, currency: 'EUR', price: 16.0, operators: ['NTT Docomo', 'SoftBank'], sms: true },
  { provider: 'alosim', name: 'Japan 3GB', country: 'JP', gb: 3, days: 15, currency: 'USD', price: 11.0, operators: ['KDDI'], technologies: ['4G'] },
  { provider: 'maya', name: 'Japan 20GB', country: 'JP', gb: 20, days: 30, currency: 'USD', price: 28.0, was: 33.0, code: 'MAYA15', percent: 15, operators: ['SoftBank'] },
  { provider: 'holafly', name: 'Japan Unlimited', country: 'JP', unlimited: true, fup: [5, 512], days: 15, currency: 'USD', price: 59.0, operators: ['NTT Docomo'], technologies: ['4G'], hotspot: false, topUp: false },
];

export const mockPlans: Plan[] = seeds.map(buildPlan);

export function getPlansForCountry(countryCode: string): Plan[] {
  return mockPlans.filter((plan) => plan.countryCode === countryCode);
}

export function getPlanById(id: string): Plan | undefined {
  return mockPlans.find((plan) => plan.id === id);
}

/** Providers that actually appear in the data, so no count is ever asserted. */
export function providerIdsForCountry(countryCode: string): string[] {
  return [...new Set(getPlansForCountry(countryCode).map((plan) => plan.providerId))];
}
