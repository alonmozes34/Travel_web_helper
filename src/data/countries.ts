import type { Locale } from '@/i18n/config';

/**
 * Destination reference data — not mock data. Names, ISO codes and slugs are
 * real; only plan and price data is mocked in this prototype.
 *
 * `aliases` exist because Israeli travellers type destinations in both
 * alphabets and rarely with punctuation: "ארהב", "usa", "thai" all have to
 * find the right country.
 */
export type Country = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** URL segment, e.g. /esim/thailand */
  slug: string;
  flag: string;
  names: Record<Locale, string>;
  aliases: string[];
  /** Shown as a one-tap shortcut in the hero. */
  popular?: boolean;
};

export const countries: Country[] = [
  {
    code: 'TH',
    slug: 'thailand',
    flag: '🇹🇭',
    names: { he: 'תאילנד', en: 'Thailand' },
    aliases: ['thai', 'bangkok', 'תאילנד', 'בנגקוק', 'קופנגן', 'פוקט'],
    popular: true,
  },
  {
    code: 'GR',
    slug: 'greece',
    flag: '🇬🇷',
    names: { he: 'יוון', en: 'Greece' },
    aliases: ['greece', 'athens', 'יוון', 'אתונה', 'רודוס', 'סנטוריני', 'כרתים'],
    popular: true,
  },
  {
    code: 'US',
    slug: 'usa',
    flag: '🇺🇸',
    names: { he: 'ארצות הברית', en: 'United States' },
    aliases: ['usa', 'us', 'america', 'ארהב', 'ארה"ב', 'אמריקה', 'ניו יורק', 'לוס אנגלס'],
    popular: true,
  },
  {
    code: 'IT',
    slug: 'italy',
    flag: '🇮🇹',
    names: { he: 'איטליה', en: 'Italy' },
    aliases: ['italy', 'rome', 'milan', 'איטליה', 'רומא', 'מילאנו', 'ונציה'],
    popular: true,
  },
  {
    code: 'FR',
    slug: 'france',
    flag: '🇫🇷',
    names: { he: 'צרפת', en: 'France' },
    aliases: ['france', 'paris', 'צרפת', 'פריז', 'ניס'],
    popular: true,
  },
  {
    code: 'JP',
    slug: 'japan',
    flag: '🇯🇵',
    names: { he: 'יפן', en: 'Japan' },
    aliases: ['japan', 'tokyo', 'יפן', 'טוקיו', 'אוסקה', 'קיוטו'],
    popular: true,
  },
  {
    code: 'CY',
    slug: 'cyprus',
    flag: '🇨🇾',
    names: { he: 'קפריסין', en: 'Cyprus' },
    aliases: ['cyprus', 'larnaca', 'קפריסין', 'לרנקה', 'פאפוס'],
  },
  {
    code: 'GE',
    slug: 'georgia',
    flag: '🇬🇪',
    names: { he: 'גאורגיה', en: 'Georgia' },
    aliases: ['georgia', 'tbilisi', 'גאורגיה', 'גרוזיה', 'טביליסי', 'בטומי'],
  },
  {
    code: 'TR',
    slug: 'turkey',
    flag: '🇹🇷',
    names: { he: 'תורכיה', en: 'Türkiye' },
    aliases: ['turkey', 'turkiye', 'istanbul', 'תורכיה', 'טורקיה', 'איסטנבול', 'אנטליה'],
  },
  {
    code: 'ES',
    slug: 'spain',
    flag: '🇪🇸',
    names: { he: 'ספרד', en: 'Spain' },
    aliases: ['spain', 'barcelona', 'madrid', 'ספרד', 'ברצלונה', 'מדריד'],
  },
  {
    code: 'GB',
    slug: 'united-kingdom',
    flag: '🇬🇧',
    names: { he: 'בריטניה', en: 'United Kingdom' },
    aliases: ['uk', 'england', 'london', 'britain', 'בריטניה', 'אנגליה', 'לונדון'],
  },
  {
    code: 'AE',
    slug: 'united-arab-emirates',
    flag: '🇦🇪',
    names: { he: 'איחוד האמירויות', en: 'United Arab Emirates' },
    aliases: ['uae', 'dubai', 'abu dhabi', 'אמירויות', 'דובאי', 'אבו דאבי'],
  },
  {
    code: 'DE',
    slug: 'germany',
    flag: '🇩🇪',
    names: { he: 'גרמניה', en: 'Germany' },
    aliases: ['germany', 'berlin', 'munich', 'גרמניה', 'ברלין', 'מינכן'],
  },
  {
    code: 'NL',
    slug: 'netherlands',
    flag: '🇳🇱',
    names: { he: 'הולנד', en: 'Netherlands' },
    aliases: ['netherlands', 'holland', 'amsterdam', 'הולנד', 'אמסטרדם'],
  },
  {
    code: 'PT',
    slug: 'portugal',
    flag: '🇵🇹',
    names: { he: 'פורטוגל', en: 'Portugal' },
    aliases: ['portugal', 'lisbon', 'פורטוגל', 'ליסבון', 'פורטו'],
  },
  {
    code: 'CZ',
    slug: 'czechia',
    flag: '🇨🇿',
    names: { he: 'צ׳כיה', en: 'Czechia' },
    aliases: ['czech', 'czechia', 'prague', 'צכיה', "צ'כיה", 'פראג'],
  },
  {
    code: 'VN',
    slug: 'vietnam',
    flag: '🇻🇳',
    names: { he: 'וייטנאם', en: 'Vietnam' },
    aliases: ['vietnam', 'hanoi', 'וייטנאם', 'ויאטנם', 'האנוי'],
  },
  {
    code: 'IN',
    slug: 'india',
    flag: '🇮🇳',
    names: { he: 'הודו', en: 'India' },
    aliases: ['india', 'delhi', 'goa', 'הודו', 'דלהי', 'גואה'],
  },
  {
    code: 'CA',
    slug: 'canada',
    flag: '🇨🇦',
    names: { he: 'קנדה', en: 'Canada' },
    aliases: ['canada', 'toronto', 'קנדה', 'טורונטו', 'ונקובר'],
  },
  {
    code: 'AU',
    slug: 'australia',
    flag: '🇦🇺',
    names: { he: 'אוסטרליה', en: 'Australia' },
    aliases: ['australia', 'sydney', 'אוסטרליה', 'סידני', 'מלבורן'],
  },
];

export const popularCountries = countries.filter((country) => country.popular);

const bySlug = new Map(countries.map((country) => [country.slug, country]));

export function getCountryBySlug(slug: string): Country | undefined {
  return bySlug.get(slug);
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

export function searchCountries(query: string, locale: Locale, limit = 6): Country[] {
  const needle = normalize(query);
  if (!needle) return [];

  const scored: Array<{ country: Country; score: number }> = [];

  for (const country of countries) {
    const haystacks = [country.names[locale], ...Object.values(country.names), ...country.aliases];
    let best = Number.POSITIVE_INFINITY;

    for (const haystack of haystacks) {
      const candidate = normalize(haystack);
      if (candidate.startsWith(needle)) best = Math.min(best, 0);
      else if (candidate.includes(needle)) best = Math.min(best, 1);
    }

    if (best !== Number.POSITIVE_INFINITY) scored.push({ country, score: best });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.country.names[locale].localeCompare(b.country.names[locale]))
    .slice(0, limit)
    .map((entry) => entry.country);
}
