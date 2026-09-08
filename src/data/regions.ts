import type { Locale } from '@/i18n/config';

/**
 * Regional groupings for multi-country plans.
 *
 * A region is a label for a set of countries, and matching always runs on the
 * country list rather than the label: "Europe" means nothing until you know
 * whether it includes the country the traveller is going to.
 */
export type Region = {
  id: string;
  names: Record<Locale, string>;
  /** ISO 3166-1 alpha-2 codes this prototype knows the region contains. */
  countries: string[];
};

export const regions: Region[] = [
  {
    id: 'europe',
    names: { he: 'אירופה', en: 'Europe' },
    countries: ['FR', 'IT', 'GR', 'ES', 'GB', 'DE', 'NL', 'PT', 'CZ', 'CY'],
  },
  {
    id: 'asia',
    names: { he: 'אסיה', en: 'Asia' },
    countries: ['TH', 'JP', 'VN', 'IN'],
  },
  {
    id: 'north-america',
    names: { he: 'צפון אמריקה', en: 'North America' },
    countries: ['US', 'CA'],
  },
  {
    id: 'global',
    names: { he: 'גלובלי', en: 'Global' },
    countries: [
      'TH', 'GR', 'US', 'IT', 'FR', 'JP', 'CY', 'GE', 'TR', 'ES',
      'GB', 'AE', 'DE', 'NL', 'PT', 'CZ', 'VN', 'IN', 'CA', 'AU',
    ],
  },
];

const byId = new Map(regions.map((region) => [region.id, region]));

export function getRegion(id: string): Region | undefined {
  return byId.get(id);
}
