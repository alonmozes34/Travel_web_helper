/**
 * Writes `src/data/destinationImages.generated.ts`: one photograph per
 * country for the top of its results, and keeps the photographs in
 * public/destinations/.
 *
 * What is pictured (the owner, 29 September 2026: "France — put the Eiffel
 * Tower or the Arc de Triomphe, by the capital"):
 *
 *  1. For the destinations people travel to most, the landmark everyone
 *     knows — chosen by hand in LANDMARKS below, by its Wikidata item.
 *  2. Otherwise the capital's own photograph (Wikidata P18 of P36).
 *  3. Otherwise the photograph this country already has, if it came from
 *     `fill-destination-images.ts` and was not taken out by hand
 *     (destination-photo-rejects.ts) — so a run that Commons slows down
 *     leaves a country as it was rather than without a photograph.
 *  4. Otherwise the country's Wikivoyage banner (P948).
 *
 * Wikivoyage's banners alone were tried first and were not what anyone
 * pictures: a village in a gorge for France, a bridge in Thrace for Greece.
 *
 * Not from Google Images: almost everything there belongs to someone who has
 * not allowed it. These are on Wikimedia Commons under free licences, and
 * only these are kept, each with its photographer and licence so the page
 * credits them as the licences require:
 *
 *   CC0, public domain, CC BY, CC BY-SA (any version), Free Art Licence
 *
 * Anything else — non-commercial, GFDL-only, no author to credit — moves on
 * to the next choice, and a country with none shows no photograph.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/fetch-destination-images.ts
 *   NODE_USE_ENV_PROXY=1 PATIENT_MINUTES=180 npx tsx scripts/fetch-destination-images.ts
 *
 * Each photograph is downloaded once, one at a time, cropped to 4:3 around
 * its most interesting part (sharp's attention strategy), and saved as WebP
 * under a name that includes its source file — so a photograph that has not
 * changed is not fetched again, and one that has is. Files no longer used
 * are removed. Served from our own site: Wikimedia turns away the image
 * optimiser's anonymous requests (HTTP 429), and a visitor's browser then
 * contacts nobody else.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { countries } from '../src/data/countries';
import { destinationImages } from '../src/data/destinationImages.generated';
import { REJECTED_PHOTO_PAGES } from './destination-photo-rejects';

const OUT = resolve(__dirname, '../src/data/destinationImages.generated.ts');
const IMAGE_DIR = resolve(__dirname, '../public/destinations');
const OUTPUT = { width: 1200, height: 900 };
const USER_AGENT = 'yeshklita-build/1.0 (https://www.yeshklita.com; yeshklita.info@gmail.com)';
/**
 * 1280px: one of the sizes every Commons file page offers, so usually already
 * rendered and cached. Asking for 1920px made Commons render each landmark's
 * large original on demand, and it let two through every five minutes.
 */
const THUMB_WIDTH = 1280;
/** Between downloads: Commons began refusing after about fifty at 1.5 seconds apart. */
const DOWNLOAD_GAP_MS = 4000;
const FREE_LICENCE = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?|fal)\b/i;

/**
 * The landmark for each of the destinations people travel to most. Each id
 * was checked against its English and Hebrew labels on Wikidata (29 and 30
 * September 2026). Add one only after checking the id is the landmark, not a
 * namesake — "Charles Bridge" is also a border crossing.
 */
const LANDMARKS: Record<string, string> = {
  AE: 'Q12495', // Burj Khalifa
  AM: 'Q554947', // Tatev Monastery
  AR: 'Q36332', // Iguazu Falls
  AT: 'Q131330', // Schönbrunn Palace
  AU: 'Q45178', // Sydney Opera House
  AZ: 'Q80499', // Flame Towers
  BA: 'Q188528', // Stari Most
  BE: 'Q215429', // Grand-Place
  BG: 'Q43282', // Alexander Nevsky Cathedral
  BH: 'Q511612', // Bahrain World Trade Center
  BO: 'Q76122', // Salar de Uyuni
  BR: 'Q79961', // Christ the Redeemer
  BT: 'Q2209873', // Paro Taktsang
  CA: 'Q134883', // CN Tower
  CH: 'Q1374', // Matterhorn
  CL: 'Q901646', // Torres del Paine
  CN: 'Q12501', // Great Wall of China
  CR: 'Q641588', // Arenal Volcano
  CU: 'Q1165566', // Old Havana
  CY: 'Q2061165', // Petra tou Romiou
  CZ: 'Q204871', // Charles Bridge
  DE: 'Q82425', // Brandenburg Gate
  DK: 'Q943946', // Nyhavn
  DO: 'Q1568095', // Punta Cana
  EE: 'Q726803', // Tallinn Old Town
  EG: 'Q37200', // Great Pyramid of Giza
  ES: 'Q48435', // Sagrada Família
  FI: 'Q738015', // Helsinki Cathedral
  FR: 'Q243', // Eiffel Tower
  GB: 'Q83125', // Tower Bridge
  GE: 'Q155453', // Narikala
  GR: 'Q131013', // Acropolis of Athens
  HK: 'Q155643', // Victoria Harbour
  HR: 'Q189849', // Plitvice Lakes
  HU: 'Q11819', // Hungarian Parliament Building
  ID: 'Q515253', // Tanah Lot
  IE: 'Q239477', // Cliffs of Moher
  IN: 'Q9141', // Taj Mahal
  IS: 'Q271466', // Hallgrímskirkja
  IT: 'Q10285', // Colosseum
  JO: 'Q1259626', // Al-Khazneh, Petra
  JP: 'Q39231', // Mount Fuji
  KE: 'Q172070', // Mount Kenya
  KH: 'Q43473', // Angkor Wat
  KR: 'Q482485', // Gyeongbokgung
  LK: 'Q272153', // Sigiriya
  LT: 'Q1497616', // Gediminas' Tower
  LV: 'Q74736', // House of the Blackheads
  MA: 'Q1137533', // Koutoubia Mosque
  MC: 'Q1779905', // Monte Carlo Casino
  ME: 'Q171080', // Kotor
  MO: 'Q1551411', // Ruins of St. Paul's
  MU: 'Q1129992', // Le Morne Brabant
  MV: 'Q1875719', // Maafushi
  MX: 'Q5859', // Chichen Itza
  MY: 'Q83063', // Petronas Towers
  NL: 'Q1344400', // Magere Brug
  NO: 'Q193989', // Geirangerfjord
  NP: 'Q889902', // Boudhanath
  NZ: 'Q187197', // Milford Sound
  OM: 'Q1548443', // Sultan Qaboos Grand Mosque
  PA: 'Q7350', // Panama Canal
  PE: 'Q676203', // Machu Picchu
  PH: 'Q977422', // Chocolate Hills
  PL: 'Q18820', // Wawel Castle
  PS: 'Q194504', // Church of the Nativity
  PT: 'Q215003', // Belém Tower
  QA: 'Q1148353', // Museum of Islamic Art
  RO: 'Q390275', // Bran Castle
  RS: 'Q1409017', // Belgrade Fortress
  RU: 'Q129846', // St. Basil's Cathedral
  SC: 'Q30744625', // Anse Source d'Argent
  SE: 'Q579854', // Gamla stan
  SG: 'Q548679', // Marina Bay Sands
  SI: 'Q648902', // Lake Bled
  SK: 'Q593311', // Bratislava Castle
  TH: 'Q873769', // Grand Palace
  TN: 'Q877391', // Sidi Bou Said
  TR: 'Q12506', // Hagia Sophia
  TW: 'Q83101', // Taipei 101
  TZ: 'Q7296', // Mount Kilimanjaro
  US: 'Q9202', // Statue of Liberty
  UZ: 'Q1373583', // Registan
  VN: 'Q190128', // Ha Long Bay
  ZA: 'Q213360', // Table Mountain
};

type ImageInfo = {
  url: string;
  descriptionurl: string;
  thumburl?: string;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
};

type Candidate = { file: string; subject: { he: string | null; en: string | null } };

type Photo = {
  file: string;
  src: string;
  width: number;
  height: number;
  subject: { he: string | null; en: string | null };
  artist: string;
  licence: string;
  licenceUrl: string | null;
  page: string;
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Set once Commons has turned an image download away repeatedly. From then
 * on only photographs already on disk are used; the rest wait for the next
 * run, which fetches only what is missing. (29 September 2026: after about
 * fifty downloads Commons let two through every ten minutes.)
 */
let downloadsThrottled = false;

/**
 * PATIENT_MINUTES=180 keeps trying for up to three hours instead of stopping
 * at the first refusal — for a run left in the background, when Commons
 * lets a few photographs through every few minutes.
 */
const patientUntil = Date.now() + Number(process.env.PATIENT_MINUTES ?? 0) * 60_000;
const PATIENT_WAIT_MS = 5 * 60_000;

/** GET, politely: Commons answers 429 when asked too fast, and says how long to wait. */
async function politeGet(url: string, accept: string, maxRetries = 6): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (!response) {
      if (attempt >= 3) throw new Error(`${url.slice(0, 120)} → no answer`);
      await pause(5000);
      continue;
    }
    if (response.ok) return response;
    if (response.status !== 429 || attempt >= maxRetries) throw new Error(`${url.slice(0, 120)} → HTTP ${response.status}`);
    const wait = 1000 * Math.min(120, Math.max(Number(response.headers.get('retry-after')) || 0, 10 * (attempt + 1)));
    console.error(`  429 from ${new URL(url).hostname}, waiting ${wait / 1000}s`);
    await pause(wait);
  }
}

async function json(url: string): Promise<unknown> {
  return (await politeGet(url, 'application/json')).json();
}

async function sparql(query: string): Promise<Array<Record<string, { value: string } | undefined>>> {
  const data = (await json(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)) as {
    results: { bindings: Array<Record<string, { value: string } | undefined>> };
  };
  return data.results.bindings;
}

const fileOf = (value: string | undefined) =>
  value ? decodeURIComponent(value.split('/Special:FilePath/')[1] ?? '').replace(/_/g, ' ') : '';

/** "<a href=…>Stefano Brivio</a>" → "Stefano Brivio"; a bare user-page link → the user name. */
function cleanArtist(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  // A photo cut from someone's photograph credits them as
  // "Their_photo.jpg : Their Name derivative work: Whoever cropped it".
  const photographer = text
    .replace(/^(File:)?.{1,120}?\.(jpe?g|png|tiff?)\s*:\s*/i, '')
    .split(/[;,]?\s*derivative work/i)[0]
    .replace(/^\*\s*/, '');
  const withoutUrls = photographer.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  if (withoutUrls) return withoutUrls.length > 60 ? `${withoutUrls.slice(0, 57).trimEnd()}…` : withoutUrls;
  const user = /User:([^/?#\s]+)/.exec(text)?.[1];
  return user ? decodeURIComponent(user).replace(/_/g, ' ') : '';
}

/** Licence and author for each file, from Commons, 40 at a time. A string is why the file cannot be used. */
async function commonsInfo(files: string[]): Promise<Map<string, (ImageInfo & { artist: string; licence: string; licenceUrl: string | null }) | string>> {
  const info = new Map<string, (ImageInfo & { artist: string; licence: string; licenceUrl: string | null }) | string>();
  for (let i = 0; i < files.length; i += 40) {
    if (i > 0) await pause(3000);
    console.error(`Commons: files ${i + 1}–${Math.min(i + 40, files.length)} of ${files.length}`);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      titles: files.slice(i, i + 40).map((file) => `File:${file}`).join('|'),
    });
    const data = (await json(`https://commons.wikimedia.org/w/api.php?${params}`)) as {
      query: {
        normalized?: Array<{ from: string; to: string }>;
        pages: Record<string, { title: string; imageinfo?: ImageInfo[] }>;
      };
    };
    const fromTitle = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of Object.values(data.query.pages)) {
      const file = (fromTitle.get(page.title) ?? page.title).replace(/^File:/, '').replace(/_/g, ' ');
      const ii = page.imageinfo?.[0];
      if (!ii) {
        info.set(file, 'missing on Commons');
        continue;
      }
      const meta = ii.extmetadata ?? {};
      const licence = String(meta.LicenseShortName?.value ?? '').trim();
      const artist = cleanArtist(String(meta.Artist?.value ?? '')) || cleanArtist(String(meta.Attribution?.value ?? ''));
      if (REJECTED_PHOTO_PAGES.has(ii.descriptionurl)) info.set(file, 'taken out by hand');
      else if (!FREE_LICENCE.test(licence)) info.set(file, `licence "${licence}"`);
      else if (!artist && !/^(cc0|public domain|pd)/i.test(licence)) info.set(file, 'no author to credit');
      else
        info.set(file, {
          ...ii,
          artist,
          licence,
          licenceUrl: meta.LicenseUrl?.value ? String(meta.LicenseUrl.value) : null,
        });
    }
  }
  return info;
}

/** The photograph, cropped to 4:3 around its most interesting part, as a WebP named after its source. */
async function savePhoto(code: string, file: string, remote: string): Promise<{ name: string; width: number; height: number }> {
  const hash = createHash('sha1').update(file).digest('hex').slice(0, 8);
  const name = `${code.toLowerCase()}-${hash}.webp`;
  const path = resolve(IMAGE_DIR, name);
  if (!existsSync(path)) {
    if (downloadsThrottled) throw new Error('not downloaded: Commons is throttling this run');
    let response: Response | null = null;
    while (!response) {
      response = await politeGet(remote, 'image/*', 2).catch(async (error) => {
        if (!String(error).includes('HTTP 429')) throw error;
        if (Date.now() + PATIENT_WAIT_MS > patientUntil) {
          downloadsThrottled = true;
          throw error;
        }
        console.error(`  Commons is throttling; trying again in ${PATIENT_WAIT_MS / 60_000} minutes`);
        await pause(PATIENT_WAIT_MS);
        return null;
      });
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await sharp(bytes)
      .resize({ ...OUTPUT, fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 64 })
      .toFile(path);
    await pause(DOWNLOAD_GAP_MS);
  }
  const { width = 0, height = 0 } = await sharp(path).metadata();
  return { name, width, height };
}

async function main() {
  const known = new Set(countries.map((country) => country.code));
  const add = (map: Map<string, Candidate[]>, code: string, candidate: Candidate) => {
    if (!known.has(code) || !candidate.file) return;
    const list = map.get(code) ?? [];
    if (!list.some((c) => c.file === candidate.file)) list.push(candidate);
    map.set(code, list);
  };
  const candidates = new Map<string, Candidate[]>();

  // 1. Landmarks.
  const landmarkRows = await sparql(`SELECT ?i ?img ?he ?en WHERE {
    VALUES ?i { ${Object.values(LANDMARKS).map((id) => `wd:${id}`).join(' ')} }
    ?i wdt:P18 ?img.
    OPTIONAL { ?i rdfs:label ?he FILTER(lang(?he) = "he") }
    OPTIONAL { ?i rdfs:label ?en FILTER(lang(?en) = "en") } }`);
  const byItem = new Map(landmarkRows.map((row) => [row.i?.value.split('/').pop() ?? '', row]));
  for (const [code, id] of Object.entries(LANDMARKS)) {
    const row = byItem.get(id);
    if (row) add(candidates, code, { file: fileOf(row.img?.value), subject: { he: row.he?.value ?? null, en: row.en?.value ?? null } });
  }

  // 2. The capital's photograph; 3. the country's Wikivoyage banner.
  await pause(2000);
  const rows = (
    await sparql(`SELECT ?code ?capImg ?capHe ?capEn ?banner WHERE {
      ?c wdt:P297 ?code.
      OPTIONAL { ?c wdt:P36 ?cap. ?cap wdt:P18 ?capImg.
        OPTIONAL { ?cap rdfs:label ?capHe FILTER(lang(?capHe) = "he") }
        OPTIONAL { ?cap rdfs:label ?capEn FILTER(lang(?capEn) = "en") } }
      OPTIONAL { ?c wdt:P948 ?banner } }`)
  ).sort((a, b) => (a.capImg?.value ?? '').localeCompare(b.capImg?.value ?? ''));
  for (const row of rows) {
    const code = (row.code?.value ?? '').toUpperCase();
    add(candidates, code, { file: fileOf(row.capImg?.value), subject: { he: row.capHe?.value ?? null, en: row.capEn?.value ?? null } });
  }
  const banners = new Map<string, Candidate[]>();
  for (const row of rows) {
    const code = (row.code?.value ?? '').toUpperCase();
    add(banners, code, { file: fileOf(row.banner?.value), subject: { he: null, en: null } });
  }

  const files = [...new Set([...candidates.values(), ...banners.values()].flat().map((c) => c.file))];
  const info = await commonsInfo(files);

  mkdirSync(IMAGE_DIR, { recursive: true });
  const entries: string[] = [];
  const left: string[] = [];
  const used = new Set<string>();
  // The landmarks and the popular destinations first, so a run that Commons
  // slows down has done the ones most people see.
  const rank = (code: string) => (LANDMARKS[code] ? 0 : countries.find((c) => c.code === code)?.popular ? 1 : 2);
  for (const country of [...countries].sort((a, b) => rank(a.code) - rank(b.code))) {
    const reasons: string[] = [];
    let saved: Photo | null = null;
    const kept = destinationImages[country.code];
    const keep = kept && kept.src.includes('-ov-') && !REJECTED_PHOTO_PAGES.has(kept.page) ? kept : null;
    const tries: Array<Candidate | 'kept'> = [...(candidates.get(country.code) ?? []), 'kept', ...(banners.get(country.code) ?? [])];
    for (const candidate of tries) {
      if (candidate === 'kept') {
        if (keep && existsSync(resolve(IMAGE_DIR, keep.src.replace('/destinations/', '')))) {
          saved = keep;
          used.add(keep.src.replace('/destinations/', ''));
          break;
        }
        continue;
      }
      const found = info.get(candidate.file);
      if (!found || typeof found === 'string') {
        reasons.push(`${candidate.file}: ${found ?? 'not returned'}`);
        continue;
      }
      try {
        if (process.env.VERBOSE) console.error(`image ${country.code} ${candidate.file}`);
        const { name, width, height } = await savePhoto(country.code, candidate.file, String(found.thumburl ?? found.url));
        used.add(name);
        saved = {
          file: candidate.file,
          src: `/destinations/${name}`,
          width,
          height,
          subject: candidate.subject,
          artist: found.artist,
          licence: found.licence,
          licenceUrl: found.licenceUrl,
          page: found.descriptionurl,
        };
        break;
      } catch (error) {
        reasons.push(`${candidate.file}: ${error instanceof Error ? error.message : error}`);
      }
    }
    if (saved) entries.push(`  ${country.code}: ${JSON.stringify(saved)},`);
    else left.push(`${country.code} — ${reasons.join('; ') || 'nothing on Wikidata'}`);
  }

  for (const name of readdirSync(IMAGE_DIR)) if (!used.has(name)) rmSync(resolve(IMAGE_DIR, name));

  writeFileSync(
    OUT,
    `// Generated by scripts/fetch-destination-images.ts and scripts/fill-destination-images.ts
// — do not edit by hand. One photograph per country, free licences only,
// with the credit each licence requires. Updated
// ${new Date().toISOString().slice(0, 10)}: ${entries.length} countries.

export type DestinationImage = {
  /** The file on Wikimedia Commons, or the photograph's title on Openverse. */
  file: string;
  /** Our copy, cropped to 4:3, in public/destinations/. */
  src: string;
  width: number;
  height: number;
  /** What is pictured — the landmark or the capital — when known. */
  subject: { he: string | null; en: string | null };
  /** Who to credit, as the source gives it. */
  artist: string;
  licence: string;
  licenceUrl: string | null;
  /** The photograph's own page: full attribution and licence. */
  page: string;
};

export const destinationImages: Partial<Record<string, DestinationImage>> = {
${entries.join('\n')}
};
`,
  );
  console.log(`${entries.length} countries with a photograph, ${left.length} without:`);
  for (const line of left) console.log(`  ${line}`);
}

void main();
