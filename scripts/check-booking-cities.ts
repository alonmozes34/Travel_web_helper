/**
 * The cities of each country the Booking.com planner offers, and which of
 * their three pages — hotels, car rental, attractions — really open. Writes
 * src/data/booking-cities.generated.ts.
 *
 *   npx tsx scripts/check-booking-cities.ts
 *
 * The owner, 14 October 2026: before Booking, ask where in the country — "Rome
 * and Florence" — and give a link per city for a hotel, a car and attractions,
 * for every country of the trip. Booking only open a city's page at the
 * address they gave it, and an address they do not know opens the whole
 * country (hotels), an error (cars) or "this page does not exist" with a 200
 * (attractions). So no city is listed on a guess.
 *
 * The cities, in this order, at most MAX_CITIES:
 *  1. the country's main city (src/data/booking-attractions.generated.ts);
 *  2. the popular destinations Booking's own country page lists, with their
 *     address and Hebrew name;
 *  3. the largest cities in our own place list, by population — Booking's
 *     list follows their bookings, and for the United States it starts with
 *     Kissimmee and has no New York.
 *
 * Every page is opened in Chromium and read, because Booking draw them in the
 * browser and answer a missing one with 200. A city is listed when its hotels
 * page opens; its cars and attractions links only when theirs do.
 */
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { chromium, type BrowserContext } from 'playwright';
import { bookingAttractionsCity } from '@/data/booking-attractions.generated';
import { countries } from '@/data/countries';
import places from '@/data/places.generated.json';

const MAX_CITIES = 12;
const run = promisify(execFile);

/**
 * Cities put first where Booking's list follows other travellers' bookings
 * (United States: Kissimmee, Myrtle Beach, Destin…). Checked like the rest.
 */
const FIRST: Record<string, Array<{ slug: string; en: string }>> = {
  US: [
    { slug: 'miami', en: 'Miami' },
    { slug: 'orlando', en: 'Orlando' },
    { slug: 'los-angeles', en: 'Los Angeles' },
    { slug: 'las-vegas', en: 'Las Vegas' },
    { slug: 'san-francisco', en: 'San Francisco' },
    { slug: 'chicago', en: 'Chicago' },
    { slug: 'washington', en: 'Washington, D.C.' },
    { slug: 'boston', en: 'Boston' },
  ],
};
const WORKERS = 6;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

type Place = [string, string, string[], string, number];
/** `booking`: Booking's own list or our main city (their names); `ours`: our place list, named from Booking's pages. */
type Candidate = { slug: string; he: string | null; en: string | null; hotelsKnown: boolean; source: 'booking' | 'ours' };
type City = { slug: string; he: string; en: string; cars: boolean; attractions: boolean };

const slugify = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const titleCase = (slug: string) => slug.replace(/(^|-)([a-z])/g, (_, dash: string, c: string) => `${dash ? ' ' : ''}${c.toUpperCase()}`);

async function open(context: BrowserContext, url: string, ready: () => boolean | Element | null) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForFunction(ready, null, { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(400);
    return page;
  } catch (error) {
    await page.close();
    throw error;
  }
}

const missingText = /לא קיים|משהו השתבש|does not exist|went wrong/i;
const THINGS_TO_DO = /^דברים (?:לעשות|שאפשר לעשות) ב/;
const HEBREW = /[\u0590-\u05FF]/;

/** Booking's popular destinations on its country page: slug → name, in its order. */
async function popular(context: BrowserContext, cc: string, lang: 'he' | 'en-gb'): Promise<Array<[string, string]>> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const page = await open(context, `https://www.booking.com/country/${cc}.${lang}.html`, () => document.querySelector('a[href*="/city/"]')).catch(() => null);
    if (!page) continue;
    const found = await page.evaluate(
      ({ cc, lang }) => {
        const seen = new Map<string, string>();
        for (const a of document.querySelectorAll<HTMLAnchorElement>(`a[href*="/city/${cc}/"]`)) {
          const m = new URL(a.href).pathname.match(new RegExp(`^/city/${cc}/([a-z0-9-]+)\\.${lang.replace('-', '\\-')}\\.html$`));
          const name = a.innerText.trim().split('\n')[0]?.trim();
          if (m && name && !seen.has(m[1])) seen.set(m[1], name);
        }
        return [...seen.entries()];
      },
      { cc, lang },
    );
    await page.close();
    if (found.length) return found;
  }
  return [];
}

/** A page that opened at its own address and is not "does not exist" — and the city its heading or title names. */
async function opens(context: BrowserContext, url: string, path: string, heading?: RegExp): Promise<{ ok: boolean; name: string | null }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const page = await open(context, url, () => document.querySelector('h1') || /לא קיים|משהו השתבש/.test(document.body?.innerText ?? '')).catch(() => null);
    if (!page) continue;
    const landed = new URL(page.url()).pathname;
    const body = await page.locator('body').innerText().catch(() => '');
    const h1 = (await page.locator('h1').first().innerText({ timeout: 2_000 }).catch(() => '')).trim();
    const title = await page.title().catch(() => '');
    await page.close();
    if (landed !== path || missingText.test(body)) return { ok: false, name: null };
    if (!heading || heading.test(h1)) return { ok: true, name: cityIn(h1) ?? cityIn(title) };
  }
  return { ok: false, name: null };
}

/** The city Booking's own Hebrew heading or title names: "דברים לעשות בקיוטו", "השכרת רכב בזול בקיוטו: …". */
function cityIn(text: string): string | null {
  const m = /^(?:דברים (?:לעשות|שאפשר לעשות) ב|השכרת רכב בזול ב|המלונות הטובים ביותר ב)([^:|–]+)/.exec(text.trim());
  const name = m?.[1]?.trim();
  return name && HEBREW.test(name) ? name : null;
}

/**
 * Hotels and cars are served whole, so they need no browser: a city Booking
 * do not know redirects to the country (hotels) or answers 404 (cars). A 202
 * is their bot check, which proves nothing about the page behind it, so that
 * — and anything else — is asked of the browser.
 */
async function served(context: BrowserContext, url: string, path: string): Promise<{ ok: boolean; name: string | null }> {
  const out = await run('curl', ['-s', '-L', '--max-redirs', '5', '-m', '40', '-A', UA, '-w', '\n%{http_code} %{url_effective}', url], { maxBuffer: 32 * 1024 * 1024 })
    .then(({ stdout }) => stdout)
    .catch(() => '');
  const [code, landed] = (out.slice(out.lastIndexOf('\n') + 1) || ' ').split(' ');
  const samePage = landed ? new URL(landed).pathname === path : false;
  const title = (/<title[^>]*>([^<]*)<\/title>/.exec(out)?.[1] ?? '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  if (code === '200' && samePage) return { ok: true, name: cityIn(title) };
  if (code === '404' || (code === '200' && !samePage)) return { ok: false, name: null };
  return opens(context, url, path);
}

async function citiesOf(context: BrowserContext, cc: string): Promise<City[]> {
  const lower = cc.toLowerCase();
  const [he, en] = [await popular(context, lower, 'he'), await popular(context, lower, 'en-gb')];
  const english = new Map(en);
  const candidates = new Map<string, Candidate>();
  const main = bookingAttractionsCity[cc];
  if (main) candidates.set(main.slug, { slug: main.slug, he: main.he, en: main.en, hotelsKnown: false, source: 'booking' });
  const heBySlug = new Map(he);
  for (const { slug, en: name } of FIRST[cc] ?? []) {
    if (!candidates.has(slug)) candidates.set(slug, { slug, he: heBySlug.get(slug) ?? null, en: name, hotelsKnown: heBySlug.has(slug), source: heBySlug.has(slug) ? 'booking' : 'ours' });
  }

  for (const [slug, name] of he) if (!candidates.has(slug)) candidates.set(slug, { slug, he: name, en: english.get(slug) ?? null, hotelsKnown: true, source: 'booking' });
  const largest = (places as Place[])
    .filter((place) => place[3] === cc)
    .sort((a, b) => b[4] - a[4])
    .slice(0, 5);
  for (const [name, , heNames] of largest) {
    const slug = slugify(name);
    if (slug && !candidates.has(slug)) candidates.set(slug, { slug, he: heNames[0] ?? null, en: name, hotelsKnown: false, source: 'ours' });
  }

  const cities: City[] = [];
  for (const candidate of candidates.values()) {
    if (cities.length >= MAX_CITIES) break;
    const { slug } = candidate;
    const hotels = candidate.hotelsKnown
      ? { ok: true, name: null }
      : await served(context, `https://www.booking.com/city/${lower}/${slug}.he.html`, `/city/${lower}/${slug}.he.html`);
    if (!hotels.ok) continue;
    const cars = await served(context, `https://www.booking.com/cars/city/${lower}/${slug}.he.html`, `/cars/city/${lower}/${slug}.he.html`);
    const attractions = await opens(
      context,
      `https://www.booking.com/things-to-do/city/${lower}/${slug}.he.html`,
      `/things-to-do/city/${lower}/${slug}.he.html`,
      THINGS_TO_DO,
    );
    // A large city of ours that Booking treat as a mere address — no car hire,
    // no attractions — is a suburb, not a destination (Samut Prakan, Amadora).
    if (candidate.source === 'ours' && !cars.ok && !attractions.ok) continue;
    // Names are Booking's own: their Hebrew list, or the city their page names.
    // Our place list's Hebrew is sometimes Yiddish spelling ("שיקאגא").
    const he = candidate.source === 'ours' ? (cars.name ?? attractions.name ?? hotels.name) : (candidate.he ?? cars.name ?? attractions.name ?? hotels.name);
    if (he && cities.some((city) => city.he === he)) continue;
    cities.push({ slug, he: he ?? candidate.en ?? titleCase(slug), en: candidate.en ?? titleCase(slug), cars: cars.ok, attractions: attractions.ok });
  }
  return cities;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: UA, locale: 'he-IL' });
  // Only the text is read: pictures, fonts and video are not fetched, which is
  // most of what four workers spent their processors on.
  await context.route('**/*', (route) =>
    ['image', 'font', 'media'].includes(route.request().resourceType()) ? route.abort() : route.continue(),
  );
  // COUNTRIES=IT,GR tries a few and writes nothing.
  const only = process.env.COUNTRIES?.split(',').filter(Boolean);
  const queue = countries
    .filter((country) => country.code !== 'IL' && (!only || only.includes(country.code)))
    .map((country) => country.code);
  const result = new Map<string, City[]>();
  let next = 0;
  await Promise.all(
    Array.from({ length: WORKERS }, async () => {
      while (next < queue.length) {
        const cc = queue[next++];
        const cities = await citiesOf(context, cc).catch(() => []);
        if (cities.length) result.set(cc, cities);
        console.log(`${cc} ${cities.length} ${cities.map((c) => `${c.slug}${c.cars ? '' : '-nocar'}${c.attractions ? '' : '-noatt'}`).join(' ')}`);
        if (only) console.log(`  ${cities.map((c) => c.he).join(' · ')}`);
      }
    }),
  );
  await browser.close();

  if (only) return;
  // A block shows in countries that always have cities, not in a count.
  const thin = ['JP', 'FR', 'GB', 'IT', 'TH', 'US', 'GR', 'ES'].filter((cc) => (result.get(cc)?.length ?? 0) < 3);
  if (thin.length) throw new Error(`fewer than three cities for ${thin.join(', ')} — Booking is likely blocking this network; nothing written`);

  const today = new Date().toISOString().slice(0, 10);
  const codes = [...result.keys()].sort();
  writeFileSync(
    'src/data/booking-cities.generated.ts',
    `// Generated by scripts/check-booking-cities.ts — do not edit by hand.
// Each page opened in a browser on ${today}: a city is here when its hotels
// page opened at its own address, and carries cars / attractions only when
// those pages did too.

export type BookingCity = { slug: string; he: string; en: string; cars: boolean; attractions: boolean };

export const bookingCitiesCheckedOn = '${today}';

export const bookingCities: Partial<Record<string, BookingCity[]>> = {
${codes.map((cc) => `  ${cc}: ${JSON.stringify(result.get(cc))},`).join('\n')}
};
`,
  );
  console.log(`${codes.length} countries, ${[...result.values()].reduce((n, c) => n + c.length, 0)} cities`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
