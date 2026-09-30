/**
 * Fills in destination photographs for the countries that have none, from
 * Openverse — the WordPress Foundation's search over openly licensed images,
 * mostly on Flickr — for each country's capital.
 *
 * Why a second source: `fetch-destination-images.ts` takes its photographs
 * from Wikimedia Commons, and from 29 September 2026 Commons answered every
 * request from our build environment with HTTP 429. The owner asked that
 * every country get a photograph. The landmark photographs stay as they are;
 * this only adds the missing ones, and never replaces one.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/fill-destination-images.ts
 *
 * Rules, the same as for Commons:
 *  - licences: CC0, public domain, CC BY, CC BY-SA only; each credited with
 *    its author, licence and a link to the photograph's page;
 *  - no photographs of people: a title or tag that names one is skipped,
 *    and every new photograph is looked at on a contact sheet before it is
 *    published (see destination-photo-rejects.ts for the ones taken out);
 *  - polite: Openverse allows 20 anonymous searches a minute and 200 a day,
 *    so one search per country, one every four seconds.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { countries } from '../src/data/countries';
import { destinationImages, type DestinationImage } from '../src/data/destinationImages.generated';
import { REJECTED_PHOTO_PAGES } from './destination-photo-rejects';

const OUT = resolve(__dirname, '../src/data/destinationImages.generated.ts');
const IMAGE_DIR = resolve(__dirname, '../public/destinations');
const OUTPUT = { width: 1200, height: 900 };
const USER_AGENT = 'yeshklita-build/1.0 (https://www.yeshklita.com; yeshklita.info@gmail.com)';
const SEARCH_GAP_MS = 4000;

/** Photographs of people, or of things a destination page should not open with. */
const UNSUITABLE =
  /\b(people|person|portrait|girls?|boys?|wom[ae]n|m[ae]n|child(ren)?|kids?|baby|selfie|face|family|friends?|wedding|bride|protest|police|military|soldiers?|army|war|funeral|crash|accident|fire|flood|ruins? of|poverty|slum|beggar|prison|food|dinner|lunch|breakfast|drink|beer|car|bus|taxi|parking|airport|hotel room|map|flag|logo|sign)\b/i;
/** What makes a good first picture of a city. */
const SCENIC =
  /\b(skyline|panorama|view|old town|old city|cathedral|mosque|temple|church|square|bridge|harbou?r|port|castle|palace|fort(ress)?|tower|river|bay|beach|city|downtown|centre|center|street|market|monument|park|lake|mountain)\b/i;


type OpenverseImage = {
  id: string;
  title: string | null;
  creator: string | null;
  url: string;
  foreign_landing_url: string;
  license: string;
  license_version: string | null;
  license_url: string | null;
  width: number | null;
  height: number | null;
  tags?: Array<{ name: string }>;
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url: string, accept: string): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (response?.ok) return response;
    if (attempt >= 3) throw new Error(`${url.slice(0, 100)} → ${response ? `HTTP ${response.status}` : 'no answer'}`);
    await pause(response?.status === 429 ? 65_000 : 5000);
  }
}

function licenceName(image: OpenverseImage): string | null {
  const version = image.license_version && image.license_version !== 'N/A' ? ` ${image.license_version}` : '';
  switch (image.license) {
    case 'cc0':
      return 'CC0';
    case 'pdm':
      return 'Public domain';
    case 'by':
      return `CC BY${version}`;
    case 'by-sa':
      return `CC BY-SA${version}`;
    default:
      return null;
  }
}

function suitable(image: OpenverseImage): boolean {
  if (REJECTED_PHOTO_PAGES.has(image.foreign_landing_url)) return false;
  if (!image.creator?.trim() && !['cc0', 'pdm'].includes(image.license)) return false;
  if ((image.width ?? 0) < 900 || (image.height ?? 0) < 500) return false;
  if ((image.width ?? 0) < (image.height ?? 0)) return false;
  const words = [image.title ?? '', ...(image.tags ?? []).map((tag) => tag.name)].join(' ');
  return !UNSUITABLE.test(words);
}

async function search(capital: string): Promise<OpenverseImage | null> {
  const params = new URLSearchParams({
    q: capital,
    license: 'by,by-sa,cc0,pdm',
    source: 'flickr',
    // Not aspect_ratio or size: combined with the licence and source filters
    // they returned nothing even for capitals (30 September 2026). Width and
    // orientation are checked in `suitable` instead.
    page_size: '20',
  });
  const data = (await (await get(`https://api.openverse.org/v1/images/?${params}`, 'application/json')).json()) as {
    results: OpenverseImage[];
  };
  const usable = data.results.filter(suitable);
  // A scenic title first; otherwise the most relevant usable result.
  return usable.find((image) => SCENIC.test(image.title ?? '')) ?? usable[0] ?? null;
}

async function capitals(): Promise<Map<string, { en: string; he: string | null }>> {
  const query = `SELECT ?code ?en ?he WHERE { ?c wdt:P297 ?code; wdt:P36 ?cap.
    ?cap rdfs:label ?en FILTER(lang(?en) = "en")
    OPTIONAL { ?cap rdfs:label ?he FILTER(lang(?he) = "he") } }`;
  const data = (await (await get(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, 'application/json')).json()) as {
    results: { bindings: Array<Record<string, { value: string } | undefined>> };
  };
  const out = new Map<string, { en: string; he: string | null }>();
  for (const row of data.results.bindings.sort((a, b) => (a.en?.value ?? '').localeCompare(b.en?.value ?? ''))) {
    const code = (row.code?.value ?? '').toUpperCase();
    if (!out.has(code) && row.en?.value) out.set(code, { en: row.en.value, he: row.he?.value ?? null });
  }
  return out;
}

async function main() {
  mkdirSync(IMAGE_DIR, { recursive: true });
  const byCode = new Map<string, DestinationImage>(
    Object.entries(destinationImages).filter((entry): entry is [string, DestinationImage] => Boolean(entry[1])),
  );
  console.error('reading capitals from Wikidata…');
  const capitalOf = await capitals();
  const missing = countries.filter((country) => !byCode.has(country.code));
  console.error(`${capitalOf.size} capitals; ${missing.length} countries to fill`);
  const added: string[] = [];
  const left: string[] = [];

  for (const country of missing) {
    const capital = capitalOf.get(country.code);
    if (!capital) {
      left.push(`${country.code} — no capital on Wikidata`);
      continue;
    }
    try {
      await pause(SEARCH_GAP_MS);
      if (process.env.VERBOSE) console.error(`search ${country.code} "${capital.en}"`);
      const image = await search(capital.en);
      const licence = image ? licenceName(image) : null;
      if (!image || !licence) {
        left.push(`${country.code} — nothing suitable for "${capital.en}"`);
        continue;
      }
      const name = `${country.code.toLowerCase()}-ov-${createHash('sha1').update(image.id).digest('hex').slice(0, 8)}.webp`;
      const path = resolve(IMAGE_DIR, name);
      if (!existsSync(path)) {
        const bytes = Buffer.from(await (await get(image.url, 'image/*')).arrayBuffer());
        await sharp(bytes).resize({ ...OUTPUT, fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 64 }).toFile(path);
      }
      const { width = 0, height = 0 } = await sharp(path).metadata();
      byCode.set(country.code, {
        file: image.title ?? capital.en,
        src: `/destinations/${name}`,
        width,
        height,
        subject: { he: capital.he, en: capital.en },
        artist: (image.creator ?? '').trim().slice(0, 60),
        licence,
        licenceUrl: image.license_url,
        page: image.foreign_landing_url,
      });
      added.push(`${country.code} ${capital.en}: "${image.title}" by ${image.creator} (${licence}) [${image.id}]`);
      if (process.env.VERBOSE) console.error(added.at(-1));
    } catch (error) {
      left.push(`${country.code} — ${error instanceof Error ? error.message : error}`);
    }
  }

  const entries = countries
    .filter((country) => byCode.has(country.code))
    .map((country) => `  ${country.code}: ${JSON.stringify(byCode.get(country.code))},`);
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
  console.log(`${added.length} added, ${entries.length} countries with a photograph, ${left.length} without:`);
  for (const line of left) console.log(`  ${line}`);
  for (const line of added) console.log(`  + ${line}`);
}

void main();
