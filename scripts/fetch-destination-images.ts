/**
 * Writes `src/data/destinationImages.generated.ts`: one photograph per
 * country, for the top of its results — the owner asked for "a famous
 * picture of the place" to give the site warmth (29 September 2026).
 *
 * Not from Google Images: almost everything there belongs to someone who has
 * not allowed it. These are the banners Wikivoyage's editors chose for each
 * country (Wikidata property P948, "Wikivoyage banner"), stored on Wikimedia
 * Commons under free licences. Only these licences are kept, and each image
 * carries its photographer and licence so the page can credit them, as the
 * licences require:
 *
 *   CC0, public domain, CC BY, CC BY-SA (any version), Free Art Licence
 *
 * Anything else — non-commercial, GFDL-only, a missing author — is left out,
 * and that country simply shows no photograph.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/fetch-destination-images.ts
 *
 * Each photograph is downloaded once, one at a time, reduced to a 1600px-wide
 * WebP and kept in public/destinations/ — served from our own site. Asking
 * Wikimedia on every visit instead failed: their servers turn away the image
 * optimiser's anonymous requests (HTTP 429), and a visitor's browser would
 * otherwise have to contact Wikimedia itself. A photograph already on disk is
 * not fetched again; pass --refresh to fetch them all.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { countries } from '../src/data/countries';

const OUT = resolve(__dirname, '../src/data/destinationImages.generated.ts');
const IMAGE_DIR = resolve(__dirname, '../public/destinations');
const OUTPUT_WIDTH = 1600;
const REFRESH = process.argv.includes('--refresh');
const USER_AGENT = 'yeshklita-build/1.0 (https://www.yeshklita.com; yeshklita.info@gmail.com)';
const THUMB_WIDTH = 1920;
const FREE_LICENCE = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?|fal)\b/i;

type ImageInfo = {
  url: string;
  descriptionurl: string;
  width: number;
  height: number;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
};

type Banner = {
  file: string;
  src: string;
  width: number;
  height: number;
  artist: string;
  licence: string;
  licenceUrl: string | null;
  page: string;
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET as JSON, politely: Commons answers 429 when asked too fast, and says how long to wait. */
async function politeGet(url: string, accept: string): Promise<Response> {
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
    if (response.status !== 429 || attempt >= 5) throw new Error(`${url.slice(0, 120)} → HTTP ${response.status}`);
    const wait = 1000 * Math.min(120, Math.max(Number(response.headers.get('retry-after')) || 0, 5 * (attempt + 1)));
    console.error(`  429 from ${new URL(url).hostname}, waiting ${wait / 1000}s`);
    await pause(wait);
  }
}

async function json(url: string): Promise<unknown> {
  return (await politeGet(url, 'application/json')).json();
}

/** The Commons thumbnail, reduced to a WebP in public/destinations/. Returns its size. */
async function saveImage(code: string, remote: string): Promise<{ width: number; height: number }> {
  const path = resolve(IMAGE_DIR, `${code.toLowerCase()}.webp`);
  if (REFRESH || !existsSync(path)) {
    const bytes = Buffer.from(await (await politeGet(remote, 'image/*')).arrayBuffer());
    await sharp(bytes).resize({ width: OUTPUT_WIDTH, withoutEnlargement: true }).webp({ quality: 68 }).toFile(path);
    await pause(1000);
  }
  const { width = 0, height = 0 } = await sharp(path).metadata();
  return { width, height };
}

/** "<a href=…>Stefano Brivio</a>" → "Stefano Brivio"; a bare user-page link → the user name. */
function cleanArtist(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  // A banner cut from someone's photograph credits them as
  // "Their_photo.jpg : Their Name derivative work: Whoever cropped it".
  // The photographer is the name to show; the file page has the rest.
  const photographer = text
    .replace(/^(File:)?.{1,120}?\.(jpe?g|png|tiff?)\s*:\s*/i, '')
    .split(/[;,]?\s*derivative work/i)[0]
    .replace(/^\*\s*/, '');
  const withoutUrls = photographer.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  if (withoutUrls) return withoutUrls.length > 60 ? `${withoutUrls.slice(0, 57).trimEnd()}…` : withoutUrls;
  const user = /User:([^/?#\s]+)/.exec(text)?.[1];
  return user ? decodeURIComponent(user).replace(/_/g, ' ') : '';
}

async function main() {
  const known = new Set(countries.map((country) => country.code));
  const sparql = `SELECT ?code ?banner WHERE { ?c wdt:P297 ?code; wdt:P948 ?banner. }`;
  const rows = (await json(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`)) as {
    results: { bindings: Array<{ code: { value: string }; banner: { value: string } }> };
  };
  // One banner per country: the first by file name, so a re-run is stable.
  const fileByCode = new Map<string, string>();
  for (const row of rows.results.bindings.sort((a, b) => a.banner.value.localeCompare(b.banner.value))) {
    const code = row.code.value.toUpperCase();
    if (!known.has(code) || fileByCode.has(code)) continue;
    fileByCode.set(code, decodeURIComponent(row.banner.value.split('/Special:FilePath/')[1] ?? ''));
  }

  const files = [...new Set(fileByCode.values())].filter(Boolean);
  const info = new Map<string, Banner | string>();
  for (let i = 0; i < files.length; i += 40) {
    const batch = files.slice(i, i + 40);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size',
      iiurlwidth: String(THUMB_WIDTH),
      titles: batch.map((file) => `File:${file}`).join('|'),
    });
    if (i > 0) await pause(3000);
    console.error(`Commons: files ${i + 1}–${Math.min(i + 40, files.length)} of ${files.length}`);
    const data = (await json(`https://commons.wikimedia.org/w/api.php?${params}`)) as {
      query: {
        normalized?: Array<{ from: string; to: string }>;
        pages: Record<string, { title: string; missing?: string; imageinfo?: ImageInfo[] }>;
      };
    };
    const fromTitle = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of Object.values(data.query.pages)) {
      const original = (fromTitle.get(page.title) ?? page.title).replace(/^File:/, '');
      const ii = page.imageinfo?.[0];
      if (!ii) {
        info.set(original, 'missing on Commons');
        continue;
      }
      const meta = ii.extmetadata ?? {};
      const licence = String(meta.LicenseShortName?.value ?? '').trim();
      // The author is usually in Artist; some files give it only as the
      // attribution line the uploader asked for.
      const artist =
        cleanArtist(String(meta.Artist?.value ?? '')) || cleanArtist(String(meta.Attribution?.value ?? ''));
      if (!FREE_LICENCE.test(licence)) {
        info.set(original, `licence "${licence}"`);
        continue;
      }
      if (!artist && !/^(cc0|public domain|pd)/i.test(licence)) {
        info.set(original, 'no author to credit');
        continue;
      }
      const thumbWidth = Number(ii.thumbwidth) || Number(ii.width);
      const thumbHeight = Number(ii.thumbheight) || Number(ii.height);
      info.set(original, {
        file: original.replace(/_/g, ' '),
        src: String(ii.thumburl ?? ii.url).split('?')[0],
        width: thumbWidth,
        height: thumbHeight,
        artist,
        licence,
        licenceUrl: meta.LicenseUrl?.value ? String(meta.LicenseUrl.value) : null,
        page: String(ii.descriptionurl),
      });
    }
  }

  mkdirSync(IMAGE_DIR, { recursive: true });
  const entries: string[] = [];
  const left: string[] = [];
  for (const country of countries) {
    const file = fileByCode.get(country.code);
    const banner = file ? info.get(file) ?? info.get(file.replace(/_/g, ' ')) : undefined;
    if (!banner || typeof banner === 'string') {
      left.push(`${country.code} ${file ?? 'no banner on Wikidata'}${typeof banner === 'string' ? ` — ${banner}` : ''}`);
      continue;
    }
    try {
      if (process.env.VERBOSE) console.error(`image ${country.code}`);
      const size = await saveImage(country.code, banner.src);
      entries.push(
        `  ${country.code}: ${JSON.stringify({ ...banner, src: `/destinations/${country.code.toLowerCase()}.webp`, ...size })},`,
      );
    } catch (error) {
      left.push(`${country.code} ${file} — download failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  writeFileSync(
    OUT,
    `// Generated by scripts/fetch-destination-images.ts — do not edit by hand.
// Wikivoyage's banner for each country, from Wikimedia Commons, free
// licences only, with the credit each licence requires. Fetched
// ${new Date().toISOString().slice(0, 10)}: ${entries.length} countries.

export type DestinationImage = {
  /** The file on Wikimedia Commons. */
  file: string;
  /** Our copy, reduced to ${OUTPUT_WIDTH}px wide, in public/destinations/. */
  src: string;
  width: number;
  height: number;
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
