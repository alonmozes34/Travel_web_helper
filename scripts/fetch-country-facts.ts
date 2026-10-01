/**
 * Writes `src/data/countryFacts.generated.ts`: the practical facts a
 * traveller looks up before a trip — capital, money, languages, plugs and
 * voltage, which side of the road, emergency numbers, time zone — for every
 * country in `src/data/countries.ts`.
 *
 * The owner's idea (1 October 2026). Nothing here is written by us; every
 * fact comes from a source that anyone can check:
 *
 *  - Money and official languages: CLDR (Unicode's locale data, the same
 *    data the operating systems use), from the `cldr-core` package. Names in
 *    Hebrew and English through `Intl.DisplayNames`, as for country names.
 *  - Capital, plug types, mains voltage, driving side, emergency numbers,
 *    calling code: Wikidata (CC0).
 *  - Time zone: the IANA time zone database (`zone.tab`), the zone nearest
 *    the capital. The difference from Israel is worked out when the page is
 *    shown, so summer time is always right.
 *  - Wikivoyage: the country's article, in Hebrew where there is one.
 *
 * A fact a source does not have is left out, never guessed. A few are taken
 * out by hand in OVERRIDES, each with its reason.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/fetch-country-facts.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { countries } from '../src/data/countries';

const OUT = resolve(__dirname, '../src/data/countryFacts.generated.ts');
const USER_AGENT = 'yeshklita-build/1.0 (https://www.yeshklita.com; yeshklita.info@gmail.com)';
const CLDR = 'https://cdn.jsdelivr.net/npm/cldr-core@47/supplemental';
const ZONE_TAB = '/usr/share/zoneinfo/zone.tab';

/**
 * Taken out by hand. Wikidata lists East Jerusalem among the capitals of
 * Palestine and a contested town for Western Sahara; on a travel page either
 * is a political statement, not a travel fact, so neither shows a capital.
 */
const OVERRIDES: Record<string, { capital?: null }> = {
  PS: { capital: null },
  EH: { capital: null },
};

/** Plug types by their Wikidata item, as the letters travellers and adapters use. */
const PLUG_LETTER: Record<string, string> = {
  Q24288454: 'A', // NEMA 1-15
  Q24288456: 'B', // NEMA 5-15
  Q1378312: 'C', // Europlug
  Q1383497: 'D', // BS 546 (also sold as type M)
  Q2335536: 'E',
  Q1123613: 'F', // Schuko
  Q1528507: 'G', // BS 1363
  Q1266396: 'H',
  Q2335539: 'I', // AS/NZS 3112
  Q2335530: 'J', // SN 441011
  Q1502017: 'K',
  Q1520890: 'L',
  Q1653438: 'N', // IEC 60906-1
  // Q60740126 "British and related types" is a family, not a plug: skipped.
};

type EmergencyUse = 'general' | 'police' | 'medical' | 'fire';
const EMERGENCY_USE: Record<string, EmergencyUse> = {
  emergency: 'general',
  police: 'police',
  'emergency medical services': 'medical',
  ambulance: 'medical',
  'fire department': 'fire',
  firefighting: 'fire',
};

type Row = Record<string, { value: string } | undefined>;
const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function getJson(url: string, accept = 'application/json'): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: accept }, signal: AbortSignal.timeout(120_000) }).catch(() => null);
    if (response?.ok) return response.json();
    if (attempt >= 4) throw new Error(`${url.slice(0, 90)} → ${response ? `HTTP ${response.status}` : 'no answer'}`);
    await pause(15_000);
  }
}

async function sparql(query: string): Promise<Row[]> {
  const data = (await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)) as {
    results: { bindings: Row[] };
  };
  await pause(2000);
  return data.results.bindings;
}

const qid = (uri: string | undefined) => uri?.split('/').pop() ?? '';

function group<T>(rows: Row[], map: (row: Row) => T | null): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const code = row.code?.value.toUpperCase();
    const value = map(row);
    if (!code || value === null) continue;
    const list = out.get(code) ?? [];
    list.push(value);
    out.set(code, list);
  }
  return out;
}

function unique<T>(list: T[], key: (value: T) => string = String): T[] {
  const seen = new Set<string>();
  return list.filter((value) => !seen.has(key(value)) && Boolean(seen.add(key(value))));
}

/** "+404251-0740023" → degrees. */
function zoneTabCoordinates(text: string): { lat: number; lon: number } {
  const match = /^([+-]\d{2})(\d{2})(\d{2})?([+-]\d{3})(\d{2})(\d{2})?$/.exec(text);
  if (!match) throw new Error(`zone.tab coordinates ${text}`);
  const part = (deg: string, min: string, sec = '0') => Math.sign(Number(deg) || 1) * (Math.abs(Number(deg)) + Number(min) / 60 + Number(sec) / 3600);
  return { lat: part(match[1], match[2], match[3]), lon: part(match[4], match[5], match[6]) };
}

async function main() {
  const known = new Set(countries.map((country) => country.code));

  console.error('Wikidata: capitals');
  const capitals = group(
    await sparql(`SELECT ?code ?he ?en ?coord WHERE { ?c wdt:P297 ?code; wdt:P36 ?cap.
      OPTIONAL { ?cap rdfs:label ?he FILTER(lang(?he) = "he") } OPTIONAL { ?cap rdfs:label ?en FILTER(lang(?en) = "en") }
      OPTIONAL { ?cap wdt:P625 ?coord } }`),
    (row) => (row.en ? { he: row.he?.value ?? null, en: row.en.value, coord: row.coord?.value ?? null } : null),
  );
  console.error('Wikidata: plugs');
  const plugs = group(await sparql('SELECT ?code ?plug WHERE { ?c wdt:P297 ?code; wdt:P2853 ?plug }'), (row) => PLUG_LETTER[qid(row.plug?.value)] ?? null);
  console.error('Wikidata: voltage');
  const voltages = group(await sparql('SELECT ?code ?v WHERE { ?c wdt:P297 ?code; wdt:P2884 ?v }'), (row) => {
    const volts = Number(row.v?.value);
    // Household supply only: 400V on France's record is its three-phase supply.
    return volts >= 100 && volts <= 250 ? volts : null;
  });
  console.error('Wikidata: driving side');
  // By the side's English label: matching on item ids got them the wrong
  // way round on the first run (France "left").
  const driving = group(
    await sparql('SELECT ?code ?label WHERE { ?c wdt:P297 ?code; wdt:P1622 ?side. ?side rdfs:label ?label FILTER(lang(?label) = "en") }'),
    (row) => {
      const label = row.label?.value.toLowerCase();
      return label === 'right' || label === 'left' ? label : null;
    },
  );
  console.error('Wikidata: emergency numbers');
  const emergency = group(
    await sparql(`SELECT ?code ?number ?use WHERE { ?c wdt:P297 ?code; p:P2852 ?st. ?st ps:P2852 ?n.
      OPTIONAL { ?n rdfs:label ?en FILTER(lang(?en) = "en") } OPTIONAL { ?n rdfs:label ?mul FILTER(lang(?mul) = "mul") }
      OPTIONAL { ?n rdfs:label ?he FILTER(lang(?he) = "he") } BIND(COALESCE(?en, ?mul, ?he) AS ?number)
      OPTIONAL { ?st pq:P366 ?u. ?u rdfs:label ?use FILTER(lang(?use) = "en") } }`),
    (row) => {
      const number = row.number?.value.trim() ?? '';
      if (!/^\d{2,5}$/.test(number)) return null;
      // A number with no stated use is the general one (112, 911, 999). One
      // with a use we do not list (a coast guard, a line for the deaf) is left out.
      const use = row.use ? EMERGENCY_USE[row.use.value.toLowerCase()] : 'general';
      return use ? { number, use } : null;
    },
  );
  console.error('Wikidata: calling codes');
  const calling = group(await sparql('SELECT ?code ?cc WHERE { ?c wdt:P297 ?code; wdt:P474 ?cc }'), (row) => {
    const value = row.cc?.value.replace(/\s/g, '') ?? '';
    return /^\+\d{1,4}$/.test(value) ? value : null;
  });
  console.error('Wikidata: Wikivoyage');
  const voyage = group(
    await sparql(`SELECT ?code ?article ?lang WHERE { ?c wdt:P297 ?code. ?article schema:about ?c; schema:isPartOf ?site.
      VALUES (?site ?lang) { (<https://he.wikivoyage.org/> "he") (<https://en.wikivoyage.org/> "en") } }`),
    (row) => (row.article && row.lang ? { lang: row.lang.value as 'he' | 'en', url: row.article.value } : null),
  );

  console.error('CLDR: currencies and languages');
  const currencyData = (await getJson(`${CLDR}/currencyData.json`)) as {
    supplemental: { currencyData: { region: Record<string, Array<Record<string, { _to?: string; _tender?: string }>>> } };
  };
  const territoryInfo = (await getJson(`${CLDR}/territoryInfo.json`)) as {
    supplemental: { territoryInfo: Record<string, { languagePopulation?: Record<string, { _officialStatus?: string; _populationPercent?: string }> }> };
  };

  const zones = new Map<string, Array<{ zone: string; lat: number; lon: number }>>();
  for (const line of readFileSync(ZONE_TAB, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [code, coords, zone] = line.split('\t');
    const list = zones.get(code) ?? [];
    list.push({ zone, ...zoneTabCoordinates(coords) });
    zones.set(code, list);
  }

  const names = {
    he: { currency: new Intl.DisplayNames('he', { type: 'currency' }), language: new Intl.DisplayNames('he', { type: 'language' }) },
    en: { currency: new Intl.DisplayNames('en', { type: 'currency' }), language: new Intl.DisplayNames('en', { type: 'language' }) },
  };
  const named = (kind: 'currency' | 'language', code: string) => {
    const he = names.he[kind].of(code);
    const en = names.en[kind].of(code);
    return { code, he: he && he !== code ? he : null, en: en && en !== code ? en : null };
  };

  const entries: string[] = [];
  const gaps: Record<string, string[]> = {};
  for (const country of countries) {
    const code = country.code;
    if (!known.has(code)) continue;
    const override = OVERRIDES[code] ?? {};

    const capitalList = unique(capitals.get(code) ?? [], (c) => c.en);
    const capital = override.capital === null ? [] : capitalList.map(({ he, en }) => ({ he, en }));

    const currency = (currencyData.supplemental.currencyData.region[code] ?? [])
      .flatMap((entry) => Object.entries(entry))
      .filter(([, info]) => !info._to && info._tender !== 'false')
      .map(([iso]) => named('currency', iso));

    const languages = Object.entries(territoryInfo.supplemental.territoryInfo[code]?.languagePopulation ?? {})
      .filter(([, info]) => info._officialStatus === 'official' || info._officialStatus === 'de_facto_official')
      .sort((a, b) => Number(b[1]._populationPercent ?? 0) - Number(a[1]._populationPercent ?? 0))
      .map(([language]) => named('language', language.replace(/_.*/, '')))
      .filter((language) => language.he || language.en);

    // The zone nearest the capital; with one zone, that zone.
    const countryZones = zones.get(code) ?? [];
    const coord = capitalList.find((c) => c.coord)?.coord;
    const point = coord ? /Point\(([-\d.]+) ([-\d.]+)\)/.exec(coord) : null;
    const nearest = point
      ? [...countryZones].sort(
          (a, b) =>
            Math.hypot(a.lat - Number(point[2]), a.lon - Number(point[1])) - Math.hypot(b.lat - Number(point[2]), b.lon - Number(point[1])),
        )[0]
      : countryZones.length === 1
        ? countryZones[0]
        : undefined;

    const emergencyList = unique(emergency.get(code) ?? [], (e) => e.number);
    const order: EmergencyUse[] = ['general', 'police', 'medical', 'fire'];
    emergencyList.sort((a, b) => order.indexOf(a.use) - order.indexOf(b.use) || a.number.localeCompare(b.number));

    const sides = unique(driving.get(code) ?? []);
    const voyages = voyage.get(code) ?? [];
    const article = voyages.find((v) => v.lang === 'he') ?? voyages.find((v) => v.lang === 'en') ?? null;

    const facts = {
      capital,
      currencies: unique(currency, (c) => c.code),
      languages: unique(languages, (l) => l.code).slice(0, 4),
      plugs: unique(plugs.get(code) ?? []).sort(),
      voltages: unique(voltages.get(code) ?? []).sort((a, b) => a - b),
      driving: sides.length === 1 ? sides[0] : null,
      emergency: emergencyList.slice(0, 5),
      callingCode: unique(calling.get(code) ?? [])[0] ?? null,
      timeZone: nearest?.zone ?? null,
      multipleTimeZones: countryZones.length > 1,
      wikivoyage: article,
    };
    for (const [key, value] of Object.entries(facts)) {
      if (value === null || (Array.isArray(value) && value.length === 0)) (gaps[key] ??= []).push(code);
    }
    entries.push(`  ${code}: ${JSON.stringify(facts)},`);
  }

  writeFileSync(
    OUT,
    `// Generated by scripts/fetch-country-facts.ts — do not edit by hand.
// Sources: CLDR (money, languages), Wikidata (capital, plugs, voltage,
// driving side, emergency numbers, calling code, Wikivoyage), and the IANA
// time zone database. A fact a source does not have is absent, not guessed.
// Fetched ${new Date().toISOString().slice(0, 10)}: ${entries.length} countries.

type Named = { code: string; he: string | null; en: string | null };

export type CountryTravelFacts = {
  /** More than one where a country has more than one (South Africa). */
  capital: Array<{ he: string | null; en: string }>;
  /** ISO codes with their names, in CLDR's order. */
  currencies: Named[];
  /** Official languages, the most spoken first. */
  languages: Named[];
  /** Plug types as letters (C, F, G…). */
  plugs: string[];
  /** Household mains voltage. */
  voltages: number[];
  driving: 'left' | 'right' | null;
  emergency: Array<{ number: string; use: 'general' | 'police' | 'medical' | 'fire' }>;
  callingCode: string | null;
  /** IANA zone nearest the capital. */
  timeZone: string | null;
  multipleTimeZones: boolean;
  wikivoyage: { lang: 'he' | 'en'; url: string } | null;
};

export const countryTravelFacts: Partial<Record<string, CountryTravelFacts>> = {
${entries.join('\n')}
};
`,
  );
  console.log(`${entries.length} countries written. Missing, by fact:`);
  for (const [key, codes] of Object.entries(gaps)) console.log(`  ${key}: ${codes.length} (${codes.slice(0, 20).join(' ')}${codes.length > 20 ? ' …' : ''})`);
}

void main();
