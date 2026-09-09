import type { Locale } from '@/i18n/config';
import { generatedCountries } from './countries.generated';
import type { ContinentId, GeneratedCountry } from './countryTypes';

/**
 * Destination reference data — not mock data. Every ISO 3166-1 country and
 * territory is here, with names from CLDR, so a traveller can look up any
 * destination on the globe and get an honest answer about it, including
 * "we have nothing for this one yet".
 *
 * The generated half is in `countries.generated.ts`. This file is the human
 * half: the search aliases and the popular shortcuts, which are judgements
 * about how Israeli travellers type and think rather than facts about the
 * world.
 */
export type Country = GeneratedCountry & {
  /**
   * Extra strings that should find this country. They exist because Israeli
   * travellers type destinations in both alphabets, rarely with punctuation,
   * and often by the city rather than the country: "ארהב", "usa", "באלי" and
   * "thai" all have to find the right place.
   */
  aliases: string[];
  /** Shown as a one-tap shortcut in the hero. */
  popular?: boolean;
};

export type { ContinentId };

const popularCodes = new Set(['TH', 'GR', 'US', 'IT', 'FR', 'JP']);

/**
 * Aliases, by country code. CLDR gives the formal name; these cover the
 * spellings and the cities people actually type. A missing entry is not a
 * problem — the search already matches any substring of either name.
 */
const aliases: Record<string, string[]> = {
  TH: ['thai', 'bangkok', 'בנגקוק', 'קופנגן', 'פוקט', 'קוסמוי'],
  GR: ['greece', 'athens', 'אתונה', 'רודוס', 'סנטוריני', 'כרתים', 'קורפו'],
  US: ['usa', 'us', 'america', 'ארהב', 'ארה"ב', 'אמריקה', 'ניו יורק', 'לוס אנגלס', 'מיאמי'],
  IT: ['italy', 'rome', 'milan', 'רומא', 'מילאנו', 'ונציה', 'פירנצה'],
  FR: ['france', 'paris', 'פריז', 'ניס', 'מרסיי'],
  JP: ['japan', 'tokyo', 'טוקיו', 'אוסקה', 'קיוטו'],
  CY: ['cyprus', 'larnaca', 'לרנקה', 'פאפוס', 'איה נאפה'],
  GE: ['georgia', 'tbilisi', 'גרוזיה', 'טביליסי', 'בטומי'],
  TR: ['turkey', 'turkiye', 'istanbul', 'טורקיה', 'איסטנבול', 'אנטליה'],
  ES: ['spain', 'barcelona', 'madrid', 'ברצלונה', 'מדריד', 'מיורקה', 'איביזה'],
  GB: ['uk', 'england', 'london', 'britain', 'אנגליה', 'לונדון', 'סקוטלנד'],
  AE: ['uae', 'dubai', 'abu dhabi', 'אמירויות', 'דובאי', 'אבו דאבי'],
  DE: ['germany', 'berlin', 'munich', 'ברלין', 'מינכן', 'פרנקפורט'],
  NL: ['netherlands', 'holland', 'amsterdam', 'אמסטרדם'],
  PT: ['portugal', 'lisbon', 'ליסבון', 'פורטו', 'מדיירה'],
  CZ: ['czech', 'czechia', 'prague', 'צכיה', 'פראג'],
  VN: ['vietnam', 'hanoi', 'ויאטנם', 'האנוי', 'הו צי מין'],
  IN: ['india', 'delhi', 'goa', 'דלהי', 'גואה', 'הימלאיה'],
  CA: ['canada', 'toronto', 'טורונטו', 'ונקובר', 'מונטריאול'],
  AU: ['australia', 'sydney', 'סידני', 'מלבורן'],
  ID: ['indonesia', 'bali', 'באלי', 'ג׳קרטה', 'גילי'],
  CH: ['switzerland', 'zurich', 'שוויץ', 'ציריך', 'ז׳נבה', 'האלפים'],
  AT: ['austria', 'vienna', 'וינה', 'זלצבורג'],
  HU: ['hungary', 'budapest', 'בודפשט'],
  PL: ['poland', 'warsaw', 'krakow', 'ורשה', 'קרקוב'],
  RO: ['romania', 'bucharest', 'בוקרשט'],
  BG: ['bulgaria', 'sofia', 'סופיה', 'בורגס', 'ורנה'],
  HR: ['croatia', 'zagreb', 'dubrovnik', 'זאגרב', 'דוברובניק', 'ספליט'],
  ME: ['montenegro', 'מונטנגרו', 'בודווה'],
  RS: ['serbia', 'belgrade', 'בלגרד'],
  AL: ['albania', 'tirana', 'טירנה'],
  SI: ['slovenia', 'ljubljana', 'לובליאנה'],
  BA: ['bosnia', 'sarajevo', 'בוסניה', 'סרייבו'],
  MT: ['malta', 'valletta', 'ולטה'],
  IE: ['ireland', 'dublin', 'דבלין'],
  BE: ['belgium', 'brussels', 'בריסל'],
  DK: ['denmark', 'copenhagen', 'קופנהגן'],
  SE: ['sweden', 'stockholm', 'שטוקהולם'],
  NO: ['norway', 'oslo', 'אוסלו', 'פיורדים'],
  FI: ['finland', 'helsinki', 'הלסינקי', 'לפלנד'],
  IS: ['iceland', 'reykjavik', 'רייקיאוויק', 'איסלנד'],
  EE: ['estonia', 'tallinn', 'טאלין'],
  LV: ['latvia', 'riga', 'ריגה'],
  LT: ['lithuania', 'vilnius', 'וילנה'],
  AZ: ['azerbaijan', 'baku', 'אזרביג׳ן', 'באקו'],
  AM: ['armenia', 'yerevan', 'ירוואן'],
  UZ: ['uzbekistan', 'samarkand', 'סמרקנד', 'טשקנט'],
  KZ: ['kazakhstan', 'almaty', 'אלמטי'],
  MX: ['mexico', 'cancun', 'קנקון', 'טולום', 'מקסיקו סיטי'],
  BR: ['brazil', 'rio', 'ריו', 'סאו פאולו', 'אמזונס'],
  AR: ['argentina', 'buenos aires', 'בואנוס איירס', 'פטגוניה'],
  CL: ['chile', 'santiago', 'סנטיאגו', 'אטקמה'],
  PE: ['peru', 'cusco', 'machu picchu', 'קוסקו', 'מאצו פיצו'],
  CO: ['colombia', 'bogota', 'בוגוטה', 'קרטחנה'],
  BO: ['bolivia', 'la paz', 'לה פאס', 'אואיוני'],
  CR: ['costa rica', 'san jose', 'סן חוסה'],
  PA: ['panama', 'פנמה סיטי'],
  DO: ['dominican', 'punta cana', 'דומיניקנה', 'פונטה קאנה'],
  CU: ['cuba', 'havana', 'הוואנה'],
  JM: ['jamaica', 'ג׳מייקה'],
  MA: ['morocco', 'marrakesh', 'מרקש', 'קזבלנקה', 'פס'],
  EG: ['egypt', 'sinai', 'sharm', 'סיני', 'שארם', 'קהיר', 'טאבה'],
  JO: ['jordan', 'petra', 'aqaba', 'פטרה', 'עקבה', 'עמאן'],
  ZA: ['south africa', 'cape town', 'קייפטאון', 'יוהנסבורג', 'ספארי'],
  TZ: ['tanzania', 'zanzibar', 'זנזיבר', 'קילימנג׳רו', 'סרנגטי'],
  KE: ['kenya', 'nairobi', 'ניירובי', 'מסאי מארה'],
  SC: ['seychelles', 'סיישל'],
  MU: ['mauritius', 'מאוריציוס'],
  MV: ['maldives', 'מלדיבים', 'מאלה'],
  LK: ['sri lanka', 'ceylon', 'קולומבו'],
  NP: ['nepal', 'kathmandu', 'קטמנדו', 'אוורסט', 'אנפורנה'],
  SG: ['singapore', 'סינגפור'],
  MY: ['malaysia', 'kuala lumpur', 'קואלה לומפור', 'לנגקאווי'],
  PH: ['philippines', 'manila', 'מנילה', 'פלאוואן', 'בוראקאי'],
  KR: ['korea', 'south korea', 'seoul', 'קוריאה', 'סיאול'],
  CN: ['china', 'beijing', 'shanghai', 'בייג׳ין', 'שנחאי'],
  TW: ['taiwan', 'taipei', 'טאיפיי'],
  HK: ['hong kong', 'הונגקונג'],
  KH: ['cambodia', 'angkor', 'קמבודיה', 'אנגקור', 'פנום פן'],
  LA: ['laos', 'לאוס', 'לואנג פראבנג'],
  MM: ['myanmar', 'burma', 'בורמה'],
  NZ: ['new zealand', 'auckland', 'אוקלנד', 'קווינסטאון'],
  FJ: ['fiji', 'פיג׳י'],
  PF: ['tahiti', 'bora bora', 'טהיטי', 'בורה בורה'],
};

export const countries: Country[] = generatedCountries.map((country) => ({
  ...country,
  aliases: aliases[country.code] ?? [],
  ...(popularCodes.has(country.code) ? { popular: true as const } : {}),
}));

export const popularCountries = countries.filter((country) => country.popular);

const bySlug = new Map(countries.map((country) => [country.slug, country]));
const byCode = new Map(countries.map((country) => [country.code, country]));

export function getCountryBySlug(slug: string): Country | undefined {
  return bySlug.get(slug);
}

export function getCountryByCode(code: string): Country | undefined {
  return byCode.get(code.toUpperCase());
}

/**
 * Fold a query so that punctuation and Hebrew diacritics do not stand between
 * a traveller and their destination: `ארה"ב`, `ארהב` and `ארה״ב` all match.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/["'’״׳.\-\s]/g, '');
}

/**
 * Ranked search over every country on the globe.
 *
 * With 250 destinations the ranking matters more than the matching: "ג" must
 * not put Guadeloupe above Georgia. A match on the name the traveller is
 * reading beats a match on a translation or a city, a match at the start
 * beats one in the middle, and a popular destination breaks the tie.
 */
export function searchCountries(query: string, locale: Locale, limit = 8): Country[] {
  const needle = normalize(query);
  if (!needle) return [];

  const scored: Array<{ country: Country; score: number }> = [];

  for (const country of countries) {
    if (country.continent === 'antarctic') continue;

    const displayName = normalize(country.names[locale]);
    const otherNames = Object.values(country.names).map(normalize);
    const aliasNames = country.aliases.map(normalize);

    let best = Number.POSITIVE_INFINITY;
    if (displayName.startsWith(needle)) best = 0;
    else if (otherNames.some((name) => name.startsWith(needle))) best = 1;
    else if (aliasNames.some((alias) => alias.startsWith(needle))) best = 2;
    else if (displayName.includes(needle)) best = 3;
    else if (otherNames.some((name) => name.includes(needle))) best = 4;
    else if (aliasNames.some((alias) => alias.includes(needle))) best = 5;

    if (best !== Number.POSITIVE_INFINITY) scored.push({ country, score: best });
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        Number(Boolean(b.country.popular)) - Number(Boolean(a.country.popular)) ||
        a.country.names[locale].localeCompare(b.country.names[locale], locale),
    )
    .slice(0, limit)
    .map((entry) => entry.country);
}
