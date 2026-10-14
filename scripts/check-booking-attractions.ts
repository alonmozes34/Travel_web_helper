/**
 * Which city's attractions page on Booking.com each country links to, checked
 * page by page — writes src/data/booking-attractions.generated.ts.
 *
 *   npx tsx scripts/check-booking-attractions.ts
 *
 * The owner asked for attractions beside hotels and cars (14 October 2026),
 * after Booking's affiliate team wrote that they now pay on attractions too.
 * Booking has no country page for them — `/attractions/country/jp.he.html`
 * answers 200 with "this page does not exist", and a search by country name
 * opens empty — only city pages (`/things-to-do/city/jp/tokyo.he.html`). So
 * each country links to one city, named on the button: the capital, or where
 * the capital is not where travellers go, the city they fly into.
 *
 * A status code proves nothing here (the missing page answers 200), and the
 * page is drawn in the browser, so each one is opened in Chromium and read:
 * it must land on that city's page, with Booking's own "things to do in …"
 * heading. A country whose page does not open gets no link — never a guess.
 */
import { writeFileSync } from 'node:fs';
import { chromium, type BrowserContext } from 'playwright';
import { countries } from '@/data/countries';
import { countryTravelFacts } from '@/data/countryFacts.generated';

/**
 * Where travellers go is not the capital. Tried in order, then the capital;
 * each is checked like the rest.
 */
const OVERRIDES: Record<string, Array<{ en: string; slug: string }>> = {
  US: [{ en: 'New York', slug: 'new-york' }],
  TR: [{ en: 'Istanbul', slug: 'istanbul' }],
  AU: [{ en: 'Sydney', slug: 'sydney' }],
  CA: [{ en: 'Toronto', slug: 'toronto' }],
  BR: [{ en: 'Rio de Janeiro', slug: 'rio-de-janeiro' }],
  CH: [{ en: 'Zurich', slug: 'zurich' }],
  AE: [{ en: 'Dubai', slug: 'dubai' }],
  MA: [{ en: 'Marrakech', slug: 'marrakech' }],
  NZ: [{ en: 'Auckland', slug: 'auckland' }],
  ZA: [{ en: 'Cape Town', slug: 'cape-town' }],
  // Bali, where most travellers to Indonesia go; Cancún, where Mexico City has no page.
  ID: [{ en: 'Ubud', slug: 'ubud' }, { en: 'Denpasar', slug: 'denpasar' }],
  MX: [{ en: 'Cancún', slug: 'cancun' }],
};

const hebrew = /[\u0590-\u05FF]/;

const slugify = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type Found = { cc: string; slug: string; he: string; en: string };

async function check(context: BrowserContext, cc: string, slug: string, en: string, heFallback: string | null): Promise<Found | null> {
  const page = await context.newPage();
  try {
    await page.goto(`https://www.booking.com/things-to-do/city/${cc.toLowerCase()}/${slug}.he.html`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // The page draws itself: wait for its heading, or for its "does not exist".
    await page
      .waitForFunction(() => document.querySelector('h1') || /לא קיים|משהו השתבש/.test(document.body?.innerText ?? ''), null, { timeout: 20_000 })
      .catch(() => {});
    await page.waitForTimeout(500);
    const landed = new URL(page.url()).pathname;
    const heading = (await page.locator('h1').first().innerText({ timeout: 5_000 }).catch(() => '')).trim();
    const missing = /לא קיים|משהו השתבש/.test(await page.locator('body').innerText());
    const city = /^דברים (?:לעשות|שאפשר לעשות) ב(.+)$/.exec(heading)?.[1]?.trim();
    if (missing || !city || landed !== `/things-to-do/city/${cc.toLowerCase()}/${slug}.he.html`) return null;
    // Booking sometimes names a city in Latin letters on its Hebrew page.
    return { cc, slug, he: hebrew.test(city) || !heFallback ? city : heFallback, en };
  } catch {
    return null;
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    locale: 'he-IL',
  });
  type Candidate = { en: string; slug: string; he: string | null };
  const queue = countries
    .filter((country) => country.code !== 'IL')
    .map((country) => {
      const capital = countryTravelFacts[country.code]?.capital[0];
      const candidates: Candidate[] = [
        ...(OVERRIDES[country.code] ?? []).map((city) => ({ ...city, he: null })),
        ...(capital ? [{ en: capital.en, slug: slugify(capital.en), he: capital.he }] : []),
      ];
      return candidates.length ? { cc: country.code, candidates } : null;
    })
    .filter((entry): entry is { cc: string; candidates: Candidate[] } => entry !== null);

  const found: Found[] = [];
  const failed: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < queue.length) {
        const { cc, candidates } = queue[next++];
        let result: Found | null = null;
        for (const { en, slug, he } of candidates) {
          // Twice: Booking's page sometimes draws nothing on the first load.
          result = (await check(context, cc, slug, en, he)) ?? (await check(context, cc, slug, en, he));
          if (result) break;
        }
        if (result) found.push(result);
        else failed.push(`${cc} ${candidates.map((c) => c.slug).join('/')}`);
        console.log(result ? `ok ${JSON.stringify(result)}` : `no ${cc} ${candidates.map((c) => c.slug).join('/')}`);
      }
    }),
  );
  await browser.close();

  found.sort((a, b) => a.cc.localeCompare(b.cc));
  // Most small countries have no page, so a count proves nothing (97 of 249 on
  // 14 October 2026). A block shows in cities that always have one.
  const sentinels = ['JP', 'FR', 'GB', 'IT', 'TH', 'US', 'GR', 'ES'];
  const absent = sentinels.filter((cc) => !found.some((f) => f.cc === cc));
  if (absent.length) throw new Error(`no page opened for ${absent.join(', ')} — Booking is likely blocking this network; nothing written`);
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    'src/data/booking-attractions.generated.ts',
    `// Generated by scripts/check-booking-attractions.ts — do not edit by hand.
// Each city page opened in a browser on ${today} and showed Booking's own
// "things to do in …" heading. A country absent here has no page that opened.

/** The city whose attractions page on Booking.com a country links to. */
export type BookingAttractionsCity = { slug: string; he: string; en: string };

export const bookingAttractionsCheckedOn = '${today}';

export const bookingAttractionsCity: Partial<Record<string, BookingAttractionsCity>> = {
${found.map((f) => `  ${f.cc}: ${JSON.stringify({ slug: f.slug, he: f.he, en: f.en })},`).join('\n')}
};
`,
  );
  console.log(`${found.length} countries have a city page; ${failed.length} do not:\n  ${failed.join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
