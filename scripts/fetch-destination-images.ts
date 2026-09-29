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
 *  3. Otherwise the country's Wikivoyage banner (P948).
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
const FREE_LICENCE = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?|fal)\b/i;

/**
 * The landmark for each of the destinations people travel to most. Each id
 * was checked against its English and Hebrew labels on Wikidata on 29
 * September 2026. Add one only after checking the id is the landmark, not a
 * namesake — "Charles Bridge" is also a border crossing.
 */
const LANDMARKS: Record<string, string> = {
  AE: 'Q12495', // Burj Khalifa
  AT: 'Q131330', // Schönbrunn Palace
  AU: 'Q45178', // Sydney Opera House
  BR: 'Q79961', // Christ the Redeemer
  CA: 'Q134883', // CN Tower
  CH: 'Q1374', // Matterhorn
  CN: 'Q12501', // Great Wall of China
  CY: 'Q2061165', // Petra tou Romiou
  CZ: 'Q204871', // Charles Bridge
  DE: 'Q82425', // Brandenburg Gate
  EG: 'Q37200', // Great Pyramid of Giza
  ES: 'Q48435', // Sagrada Família
  FR: 'Q243', // Eiffel Tower
  GB: 'Q83125', // Tower Bridge
  GR: 'Q131013', // Acropolis of Athens
  HR: 'Q189849', // Plitvice Lakes
  HU: 'Q11819', // Hungarian Parliament Building
  ID: 'Q515253', // Tanah Lot
  IN: 'Q9141', // Taj Mahal
  IT: 'Q10285', // Colosseum
  JP: 'Q39231', // Mount Fuji
  KH: 'Q43473', // Angkor Wat
  KR: 'Q482485', // Gyeongbokgung
  MA: 'Q1137533', // Koutoubia Mosque
  ME: 'Q171080', // Kotor
  MX: 'Q5859', // Chichen Itza
  MY: 'Q83063', // Petronas Towers
  NL: 'Q1344400', // Magere Brug
  PE: 'Q676203', // Machu Picchu
  PL: 'Q18820', // Wawel Castle
  PT: 'Q215003', // Belém Tower
  RO: 'Q390275', // Bran Castle
  SG: 'Q548679', // Marina Bay Sands
  SI: 'Q648902', // Lake Bled
  TH: 'Q873769', // Grand Palace
  TR: 'Q12506', // Hagia Sophia
  US: 'Q9202', // Statue of Liberty
  VN: 'Q190128', // Ha Long Bay
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
      if (!FREE_LICENCE.test(licence)) info.set(file, `licence "${licence}"`);
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
    const response = await politeGet(remote, 'image/*', 2).catch((error) => {
      if (String(error).includes('HTTP 429')) downloadsThrottled = true;
      throw error;
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    await sharp(bytes)
      .resize({ ...OUTPUT, fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 64 })
      .toFile(path);
    await pause(1500);
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
  for (const row of rows) {
    const code = (row.code?.value ?? '').toUpperCase();
    add(candidates, code, { file: fileOf(row.banner?.value), subject: { he: null, en: null } });
  }

  const files = [...new Set([...candidates.values()].flat().map((c) => c.file))];
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
    for (const candidate of candidates.get(country.code) ?? []) {
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
    `// Generated by scripts/fetch-destination-images.ts — do not edit by hand.
// One photograph per country, from Wikimedia Commons, free licences only,
// with the credit each licence requires. Fetched
// ${new Date().toISOString().slice(0, 10)}: ${entries.length} countries.

export type DestinationImage = {
  /** The file on Wikimedia Commons. */
  file: string;
  /** Our copy, cropped to 4:3, in public/destinations/. */
  src: string;
  width: number;
  height: number;
  /** What is pictured — the landmark or the capital — when known. */
  subject: { he: string | null; en: string | null };
  /** Who to credit, as Commons gives it. */
  artist: string;
  licence: string;
  licenceUrl: string | null;
  /** The file's page on Commons: full attribution and licence. */
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
