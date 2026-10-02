/**
 * Writes `src/data/places.generated.json`: cities a traveller may type
 * instead of a country ("נאפולי", "Chiang Mai", "לאס וגאס"), each with the
 * country it is in, so the search can say "נאפולי · איטליה" and offer Italy
 * (the owner, 2 October 2026). eSIMs are sold by country; a city only leads
 * to its country.
 *
 * Source: GeoNames `cities15000` (every place of 15,000 people or more),
 * CC BY 4.0 — credited on the About page. Hebrew names are the Hebrew-script
 * alternate names GeoNames lists. Kept: populated places (not districts or
 * historical ones) in a country we list, with 50,000 people or more, or with
 * a Hebrew name at any size — a Hebrew name is a sign Israelis go there.
 *
 * Only the server reads this file (`/api/places`); the visitor's browser
 * asks it, so the list never ships to a phone.
 *
 *   NODE_USE_ENV_PROXY=1 npx tsx scripts/generate-places.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { countries } from '../src/data/countries';

const OUT = resolve(__dirname, '../src/data/places.generated.json');
const SOURCE = 'https://download.geonames.org/export/dump/cities15000.zip';
const MIN_POPULATION = 50_000;
const SKIP_FEATURES = new Set(['PPLX', 'PPLH', 'PPLQ', 'PPLW', 'PPLCH']);
const HEBREW = /[֐-׿]/;

/** [English name, ASCII name or "" when the same, Hebrew names, country code, population] */
type Place = [string, string, string[], string, number];

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'geonames-'));
  const zip = join(dir, 'cities.zip');
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`GeoNames answered ${response.status}`);
  writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
  const text = execFileSync('unzip', ['-p', zip, 'cities15000.txt'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');

  const known = new Set(countries.map((country) => country.code));
  const places: Place[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const f = line.split('\t');
    const [, name, ascii, alternates, , , , feature, code, , , , , , population] = f;
    if (!known.has(code) || SKIP_FEATURES.has(feature)) continue;
    const hebrew = [...new Set(alternates.split(',').filter((alt) => HEBREW.test(alt)).map((alt) => alt.trim()))].slice(0, 4);
    const people = Number(population) || 0;
    if (people < MIN_POPULATION && hebrew.length === 0) continue;
    places.push([name, ascii && ascii !== name ? ascii : '', hebrew, code, people]);
  }
  places.sort((a, b) => b[4] - a[4]);
  writeFileSync(OUT, JSON.stringify(places));
  console.log(`${places.length} places written (${places.filter((p) => p[2].length).length} with a Hebrew name)`);
}

void main();
