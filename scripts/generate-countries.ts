/**
 * Generates `src/data/countries.generated.ts` — every ISO 3166-1 country and
 * territory an eSIM can be sold for.
 *
 * Nothing here is invented. Names come from CLDR through `Intl.DisplayNames`,
 * which is the same data the operating systems use, so the Hebrew reads the
 * way a traveller expects rather than the way a developer guessed. Flags are
 * derived from the country code itself, and slugs from the English name.
 *
 * Run with `npm run generate:countries`. The output is committed so that the
 * runtime never depends on the ICU build of whatever Node runs the server,
 * and so that a change to the country list shows up as a reviewable diff.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Continents as a traveller groups them, not as the UN does. Cyprus, Turkey
 * and Georgia sit in Asia under UN M49 and in Europe in every eSIM catalogue
 * and travel agency, and this list exists to help someone find their
 * destination, so it follows the catalogues.
 *
 * This is a browsing aid. It is NOT the coverage of any regional plan — that
 * only ever comes from the country list a provider publishes for that plan.
 * See `src/data/regions.ts`.
 */
const byContinent: Record<string, string[]> = {
  europe: [
    'AD', 'AL', 'AM', 'AT', 'AX', 'AZ', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK',
    'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GE', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM', 'IS',
    'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT',
    'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'TR', 'UA', 'VA', 'XK',
  ],
  'middle-east': [
    'AE', 'BH', 'EG', 'IL', 'IQ', 'IR', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'YE',
  ],
  asia: [
    'AF', 'BD', 'BN', 'BT', 'CN', 'HK', 'ID', 'IN', 'JP', 'KG', 'KH', 'KP', 'KR', 'KZ', 'LA',
    'LK', 'MM', 'MN', 'MO', 'MV', 'MY', 'NP', 'PH', 'PK', 'SG', 'TH', 'TJ', 'TL', 'TM', 'TW',
    'UZ', 'VN',
  ],
  africa: [
    'AO', 'BF', 'BI', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'CV', 'DJ', 'DZ', 'EH', 'ER',
    'ET', 'GA', 'GH', 'GM', 'GN', 'GQ', 'GW', 'KE', 'KM', 'LR', 'LS', 'LY', 'MA', 'MG', 'ML',
    'MR', 'MU', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RE', 'RW', 'SC', 'SD', 'SH', 'SL', 'SN', 'SO',
    'SS', 'ST', 'SZ', 'TD', 'TG', 'TN', 'TZ', 'UG', 'YT', 'ZA', 'ZM', 'ZW',
  ],
  'north-america': [
    'BZ', 'CA', 'CR', 'GL', 'GT', 'HN', 'MX', 'NI', 'PA', 'PM', 'SV', 'US',
  ],
  caribbean: [
    'AG', 'AI', 'AW', 'BB', 'BL', 'BM', 'BQ', 'BS', 'CU', 'CW', 'DM', 'DO', 'GD', 'GP', 'HT',
    'JM', 'KN', 'KY', 'LC', 'MF', 'MQ', 'MS', 'PR', 'SX', 'TC', 'TT', 'VC', 'VG', 'VI',
  ],
  'south-america': [
    'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE',
  ],
  oceania: [
    'AS', 'AU', 'CC', 'CK', 'CX', 'FJ', 'FM', 'GU', 'KI', 'MH', 'MP', 'NC', 'NF', 'NR', 'NU', 'NZ', 'PF',
    'PG', 'PN', 'PW', 'SB', 'TK', 'TO', 'TV', 'VU', 'WF', 'WS',
  ],
  /** Uninhabited or research-only. Kept so the ISO list is complete, hidden in the UI. */
  antarctic: ['AQ', 'BV', 'GS', 'HM', 'IO', 'TF', 'UM'],
};

/**
 * CLDR knows several codes that ISO 3166-1 does not assign to a country:
 * groupings (EU, EZ, UN), exceptional reservations (AC, CP, CQ, DG, EA, IC,
 * TA), private-use placeholders (QO, XA, XB, ZZ), the GB alias UK, and codes
 * withdrawn decades ago (AN, BU, CS, DD, DY, FX, HV, NH, NT, RH, SU, TP, VD,
 * YD, YU, ZR). None of them is a destination, so none of them belongs in a
 * destination picker.
 */
const notACountry = new Set([
  'AC', 'AN', 'BU', 'CP', 'CQ', 'CS', 'DD', 'DG', 'DY', 'EA', 'EU', 'EZ', 'FX', 'HV', 'IC',
  'NH', 'NT', 'QO', 'RH', 'SU', 'TA', 'TP', 'UK', 'UN', 'VD', 'XA', 'XB', 'YD', 'YU', 'ZR',
  'ZZ',
]);

/**
 * Where CLDR's Hebrew is technically right but not what anyone would type or
 * read in a list of holiday destinations. The disambiguation CLDR adds is
 * useful in a country picker for legal forms and noise in ours.
 */
const hebrewOverrides: Record<string, string> = {
  HK: 'הונג קונג',
  MO: 'מקאו',
  MM: 'מיאנמר',
  CD: 'קונגו קינשאסה',
  CG: 'קונגו ברזוויל',
  AE: 'איחוד האמירויות',
};

/** URLs that already exist and must keep working. */
const slugOverrides: Record<string, string> = {
  US: 'usa',
  TR: 'turkey',
};

const heNames = new Intl.DisplayNames(['he'], { type: 'region' });
const enNames = new Intl.DisplayNames(['en'], { type: 'region' });

function flagOf(code: string): string {
  return String.fromCodePoint(...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Row = {
  code: string;
  slug: string;
  flag: string;
  he: string;
  en: string;
  continent: string;
};

const rows: Row[] = [];
const seenCodes = new Set<string>();

for (const [continent, codes] of Object.entries(byContinent)) {
  for (const code of codes) {
    if (seenCodes.has(code)) throw new Error(`${code} is listed under more than one continent`);
    seenCodes.add(code);

    const he = hebrewOverrides[code] ?? heNames.of(code);
    const en = enNames.of(code);
    if (!he || he === code) throw new Error(`no Hebrew name for ${code}`);
    if (!en || en === code) throw new Error(`no English name for ${code}`);

    rows.push({
      code,
      slug: slugOverrides[code] ?? slugify(en),
      flag: flagOf(code),
      he,
      en,
      continent,
    });
  }
}

// Every code CLDR knows is either a country we list or one we consciously excluded.
const unclassified: string[] = [];
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a) + String.fromCharCode(b);
    const name = heNames.of(code);
    if (!name || name === code) continue;
    if (seenCodes.has(code) || notACountry.has(code)) continue;
    unclassified.push(`${code} (${name})`);
  }
}
if (unclassified.length > 0) {
  throw new Error(`codes neither listed nor excluded: ${unclassified.join(', ')}`);
}

const bySlug = new Map<string, string>();
for (const row of rows) {
  const clash = bySlug.get(row.slug);
  if (clash) throw new Error(`${row.code} and ${clash} both slugify to "${row.slug}"`);
  bySlug.set(row.slug, row.code);
}

rows.sort((a, b) => a.code.localeCompare(b.code));

const body = rows
  .map(
    (row) =>
      `  { code: '${row.code}', slug: '${row.slug}', flag: '${row.flag}', continent: '${row.continent}',\n` +
      `    names: { he: '${row.he.replace(/'/g, "\\'")}', en: '${row.en.replace(/'/g, "\\'")}' } },`,
  )
  .join('\n');

const file = `// Generated by scripts/generate-countries.ts — do not edit by hand.
// Names come from CLDR via Intl.DisplayNames; run \`npm run generate:countries\` to refresh.
import type { GeneratedCountry } from './countryTypes';

export const generatedCountries: GeneratedCountry[] = [
${body}
];
`;

writeFileSync(resolve('src/data/countries.generated.ts'), file);

const counts = Object.entries(byContinent).map(([key, codes]) => `${key} ${codes.length}`);
console.log(`wrote ${rows.length} countries — ${counts.join(', ')}`);
