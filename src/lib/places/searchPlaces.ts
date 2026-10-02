import { normalize } from '@/data/countries';

/** As written by scripts/generate-places.ts: [English, ASCII or "", Hebrew names, country code, population]. */
export type PlaceRow = [string, string, string[], string, number];

export type PlaceMatch = {
  /** The name to show, in the visitor's language when GeoNames has it. */
  name: string;
  countryCode: string;
};

/**
 * Cities whose name starts with what the traveller typed, best first: an
 * exact name before a longer one, then the bigger place — Naples,
 * Italy before Naples, Florida. The name shown follows the script that was
 * typed; `locale` is kept for the route's signature.
 */
export function searchPlaces(rows: readonly PlaceRow[], query: string, locale: 'he' | 'en', limit = 6): PlaceMatch[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const scored: Array<{ match: PlaceMatch; score: number; population: number }> = [];
  for (const [en, ascii, hebrew, countryCode, population] of rows) {
    const names = [en, ascii, ...hebrew].filter(Boolean).map(normalize);
    let score = Infinity;
    if (names.some((name) => name === needle)) score = 0;
    else if (names.some((name) => name.startsWith(needle))) score = 1;
    // No "contains" tier: "נאפולי" inside "קאנאפוליס" offered Kannapolis,
    // North Carolina to someone looking for Naples.
    if (score === Infinity) continue;
    // The name in the script that was typed: GeoNames lists several Hebrew-
    // script spellings, some of them Yiddish ("נאפאלי"), so a Hebrew name is
    // shown only as the traveller wrote it, never picked for them.
    const typedHebrew = /[\u0590-\u05FF]/.test(query);
    const heName = typedHebrew ? hebrew.find((name) => normalize(name).startsWith(needle)) : undefined;
    const name = heName ?? en;
    scored.push({ match: { name, countryCode }, score, population });
  }
  return scored
    .sort((a, b) => a.score - b.score || b.population - a.population)
    .slice(0, limit)
    .map((entry) => entry.match);
}
