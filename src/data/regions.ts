import type { Locale } from '@/i18n/config';
import { countries } from './countries';
import type { ContinentId } from './countryTypes';

/**
 * Regional groupings, derived from the continent each country is filed under.
 *
 * A region here is only a label and the full set of countries in it. It is
 * NOT the coverage of any plan: a provider's "Europe" plan covers the
 * destinations that provider publishes, which is always a subset and never
 * the same subset twice. Plan coverage lives on the plan, and matching always
 * runs on the plan's own country list — see `src/lib/types/coverage.ts`.
 */
export type Region = {
  id: string;
  names: Record<Locale, string>;
  /** Every country on the continent. */
  countries: string[];
};

const regionNames: Record<ContinentId | 'global', Record<Locale, string>> = {
  europe: { he: 'אירופה', en: 'Europe' },
  'middle-east': { he: 'המזרח התיכון', en: 'Middle East' },
  asia: { he: 'אסיה', en: 'Asia' },
  africa: { he: 'אפריקה', en: 'Africa' },
  'north-america': { he: 'צפון ומרכז אמריקה', en: 'North & Central America' },
  caribbean: { he: 'הקאריביים', en: 'The Caribbean' },
  'south-america': { he: 'דרום אמריקה', en: 'South America' },
  oceania: { he: 'אוקיאניה', en: 'Oceania' },
  antarctic: { he: 'אנטארקטיקה', en: 'Antarctic' },
  global: { he: 'גלובלי', en: 'Global' },
};

/** Continents a traveller can be sold an eSIM for. */
export const destinationContinents: ContinentId[] = [
  'europe',
  'middle-east',
  'asia',
  'africa',
  'north-america',
  'caribbean',
  'south-america',
  'oceania',
];

export const regions: Region[] = [
  ...destinationContinents.map((continent) => ({
    id: continent,
    names: regionNames[continent],
    countries: countries.filter((country) => country.continent === continent).map((c) => c.code),
  })),
  {
    id: 'global',
    names: regionNames.global,
    countries: countries
      .filter((country) => country.continent !== 'antarctic')
      .map((country) => country.code),
  },
];

const byId = new Map(regions.map((region) => [region.id, region]));

export function getRegion(id: string): Region | undefined {
  return byId.get(id);
}

export function getRegionName(id: string, locale: Locale): string | undefined {
  return byId.get(id)?.names[locale];
}
