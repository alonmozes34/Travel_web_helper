import type { Locale } from '@/i18n/config';

/** Travel-oriented grouping used for browsing. Never plan coverage. */
export const continentIds = [
  'europe',
  'middle-east',
  'asia',
  'africa',
  'north-america',
  'caribbean',
  'south-america',
  'oceania',
  'antarctic',
] as const;

export type ContinentId = (typeof continentIds)[number];

/** The generated half of a country: reference data, identical for everyone. */
export type GeneratedCountry = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** URL segment, e.g. /esim/thailand */
  slug: string;
  flag: string;
  continent: ContinentId;
  names: Record<Locale, string>;
};
