import { normalize } from './countries';

/**
 * The regions that have a page of their own: "eSIM for the Balkans" and the
 * like (the owner, 15 October 2026 — many travellers from Israel visit several
 * countries on one trip).
 *
 * A list here is the question the page asks — "which of these countries are
 * you going to?" — and never a plan's coverage. A provider's "Balkans" plan
 * covers the countries on its own list, which the page compares with this one
 * country by country; nothing reads this list as what any plan includes.
 *
 * Kept apart from `regions.ts` on purpose: those continents feed the demo
 * catalogue's coverage and a provider adapter's region matching, and an
 * editorial list must reach neither (`tests/region-pages.test.ts`).
 */
export type RegionPageId = 'europe' | 'balkans' | 'south-east-asia';

export type RegionPage = {
  id: RegionPageId;
  /** In the order the page lists them. */
  countries: readonly string[];
  /**
   * Where the list comes from, said on the page: a definition anyone can
   * check, or our own choice, which the page says is ours.
   */
  basis: 'eea-uk-ch' | 'un-m49' | 'editorial';
  /** When the list was last chosen. */
  chosenOn: string;
  /**
   * What a traveller types for it in the destination search, in both
   * languages (the owner, 15 October 2026: "an option by region in the
   * search"). Matched as the start of a word, after `normalize`.
   */
  aliases: readonly string[];
};

export const regionPages: readonly RegionPage[] = [
  {
    id: 'europe',
    // The European Economic Area — the EU and Iceland, Liechtenstein and
    // Norway — with the UK and Switzerland. Our continent table also files
    // Russia, the Caucasus and Svalbard under Europe, and against that list
    // every real Europe plan would read "about twenty countries missing".
    countries: [
      'FR', 'IT', 'ES', 'DE', 'GB', 'GR', 'PT', 'NL', 'AT', 'CH', 'CZ', 'HU',
      'PL', 'BE', 'IE', 'HR', 'CY', 'BG', 'RO', 'SK', 'SI', 'DK', 'SE', 'NO',
      'FI', 'IS', 'EE', 'LV', 'LT', 'LU', 'MT', 'LI',
    ],
    basis: 'eea-uk-ch',
    chosenOn: '2026-10-15',
    aliases: ['אירופה', 'אירופה המערבית', 'האיחוד האירופי', 'Europe', 'European Union', 'EU'],
  },
  {
    id: 'balkans',
    // Ours: the countries of the peninsula a "Balkans trip" usually means.
    // Greece, Turkey and Romania are left to their own pages, as trips of
    // their own.
    countries: ['HR', 'ME', 'BA', 'RS', 'AL', 'MK', 'SI', 'BG', 'XK'],
    basis: 'editorial',
    chosenOn: '2026-10-15',
    aliases: ['הבלקן', 'בלקן', 'Balkans', 'Balkan'],
  },
  {
    id: 'south-east-asia',
    // The UN's "South-eastern Asia" (M49), all eleven.
    countries: ['TH', 'VN', 'ID', 'PH', 'MY', 'SG', 'KH', 'LA', 'MM', 'BN', 'TL'],
    basis: 'un-m49',
    chosenOn: '2026-10-15',
    aliases: ['דרום מזרח אסיה', 'מזרח אסיה', 'אסיה', 'South-East Asia', 'Southeast Asia', 'South East Asia', 'Asia', 'SEA'],
  },
];

const byId = new Map(regionPages.map((region) => [region.id, region]));

export function getRegionPage(id: string): RegionPage | undefined {
  return byId.get(id as RegionPageId);
}

/**
 * The regions a search box query names: a query of two letters or more that
 * begins one of a region's names ("בלק", "europ"), or a name followed by
 * more ("אירופה 2 שבועות" does not happen, but "Balkans trip" might).
 */
export function searchRegionPages(query: string): RegionPage[] {
  const typed = normalize(query);
  if (typed.length < 2) return [];
  return regionPages.filter((region) =>
    region.aliases.some((alias) => {
      const name = normalize(alias);
      return name.startsWith(typed) || (typed.startsWith(name) && name.length >= 3);
    }),
  );
}
