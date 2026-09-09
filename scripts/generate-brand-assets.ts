/**
 * Renders every brand raster from one source of truth.
 *
 * `src/app/icon.svg` is the mark; the share image is drawn here from the same
 * dictionary entries the site itself renders, so a change to the brand is a
 * change to one SVG plus one dictionary, and one run of:
 *
 *   npm run build && npm run start
 *   BASE_URL=http://localhost:3000 npm run generate:brand
 *
 * Playwright rather than a raster library: the share image has to be set in
 * Rubik and Assistant, in Hebrew, right-to-left, in the site's real colours.
 * A browser already knows how to do that. It is drawn *inside a page of the
 * running site* so it inherits the exact font files `next/font` self-hosts —
 * fetching from Google Fonts here is either blocked or silently falls back to
 * a system face, and a share image is the one asset nobody looks at twice
 * after it ships.
 *
 * Output is committed: a share card must not depend on a browser being
 * available wherever the site happens to be built.
 */
import { chromium, type Browser } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { he } from '../src/i18n/dictionaries/he';
import { en } from '../src/i18n/dictionaries/en';
import { localeConfig, locales, type Locale } from '../src/i18n/config';

const root = new URL('../', import.meta.url);
const at = (path: string) => fileURLToPath(new URL(path, root));

const markSvg = readFileSync(at('src/app/icon.svg'), 'utf8');
const dictionaries: Record<Locale, typeof he> = { he, en };

/**
 * The mark alone, on its tile, at an exact pixel size.
 *
 * `bleed` squares off the tile: iOS applies its own superellipse mask to a
 * touch icon, so rounded corners of our own would be composited against black
 * outside that mask and show as dark notches.
 */
const iconPage = (size: number, { bleed = false } = {}) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:transparent}
  svg{display:block;width:${size}px;height:${size}px}
  ${bleed ? 'rect:first-of-type{rx:0;ry:0}' : ''}
</style>
${markSvg}`;

/**
 * A PNG-in-ICO container: one directory entry per size, PNG payloads after.
 *
 * Every entry must be 32bpp. A squared-off tile has nothing transparent in it,
 * so the encoder drops the alpha channel and produces a 24bpp PNG that ICO
 * decoders — Next's included — reject outright. The rounded tile always keeps
 * its transparent corners, so this is checked rather than assumed.
 */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  for (const { size, png } of images) {
    // IHDR colour type sits at byte 25; 6 is truecolour with alpha.
    if (png[25] !== 6) throw new Error(`ICO entry at ${size}px is not RGBA (colour type ${png[25]})`);
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size, 0 for true colour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

const written: string[] = [];
function write(path: string, buffer: Buffer | string) {
  writeFileSync(at(path), buffer);
  written.push(`${path}${Buffer.isBuffer(buffer) ? ` (${buffer.length} bytes)` : ''}`);
}

async function renderIcon(browser: Browser, size: number, options?: { bleed: boolean }) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(iconPage(size, options));
  // `omitBackground` keeps the tile's rounded corners transparent, which is
  // also what gives the PNG an alpha channel — see buildIco.
  const png = await page.screenshot({ type: 'png', omitBackground: true });
  await page.close();
  return png;
}

/**
 * The share image: white ground, the wordmark, and the one sentence that says
 * we are not the shop. WhatsApp is where an Israeli link actually gets shared
 * and it will not render an SVG, so this is a PNG at the 1.91:1 ratio every
 * platform crops to.
 */
async function renderShareImage(browser: Browser, base: string, locale: Locale) {
  const dict = dictionaries[locale];
  const { htmlLang, dir } = localeConfig[locale];
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/${locale}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Both families have to have actually arrived. A share image that silently
  // fell back to a system face is worse than one that failed loudly.
  const families = await page.evaluate(() =>
    [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family).join(' '),
  );
  for (const family of ['Rubik', 'Assistant']) {
    if (!families.includes(family)) {
      throw new Error(`${family} did not load from ${base} — is the built site running?`);
    }
  }

  await page.evaluate(
    ([mark, name, descriptor, trust, lang, direction]) => {
      const wordmark = name.endsWith('?')
        ? `${name.slice(0, -1)}<span class="og-q">?</span>`
        : name;
      document.documentElement.lang = lang;
      document.documentElement.dir = direction;
      document.body.innerHTML = `
        <div class="og">
          <div class="og-mark">${mark}</div>
          <h1 class="og-wordmark">${wordmark}</h1>
          <p class="og-descriptor">${descriptor}</p>
          <div class="og-rule"></div>
          <p class="og-trust">${trust}</p>
          <div class="og-base"></div>
        </div>`;
      const style = document.createElement('style');
      style.textContent = `
        html,body{margin:0;padding:0;background:#fff;overflow:hidden}
        .og{width:1200px;height:630px;box-sizing:border-box;padding:0 86px;background:#fff;
            display:flex;flex-direction:column;justify-content:center;position:relative;
            font-family:var(--font-assistant);color:#14232f}
        .og-mark{position:absolute;top:64px;inset-inline-start:86px;width:84px;height:84px}
        .og-mark svg{display:block;width:84px;height:84px}
        .og-wordmark{font-family:var(--font-rubik);font-weight:700;font-size:132px;line-height:1.02;
                     letter-spacing:-.02em;margin:0;white-space:nowrap}
        .og-q{color:#0b6bd3}
        .og-descriptor{font-family:var(--font-rubik);font-weight:500;font-size:52px;line-height:1.25;
                       color:#47596b;margin:18px 0 0}
        .og-rule{width:180px;height:5px;background:#16bfb6;border-radius:3px;margin:38px 0 0}
        .og-trust{font-size:34px;font-weight:600;color:#5c6f82;margin:26px 0 0}
        .og-base{position:absolute;inset-inline:0;bottom:0;height:14px;background:#0b6bd3}`;
      document.head.append(style);
    },
    [markSvg, dict.brand.name, dict.meta.tagline, dict.disclosure.short, htmlLang, dir] as const,
  );

  await page.waitForTimeout(300);
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return png;
}

/** Kept in step with `shareImagePath` in src/lib/site.ts. */
function shareImageName(locale: Locale) {
  return `share-${locale}.png`;
}

async function main() {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  const browser = await chromium.launch();

  try {
    write('src/app/apple-icon.png', await renderIcon(browser, 180, { bleed: true }));
    write('public/icon-192.png', await renderIcon(browser, 192));
    write('public/icon-512.png', await renderIcon(browser, 512));
    write(
      'src/app/favicon.ico',
      buildIco(
        await Promise.all(
          [16, 32, 48].map(async (size) => ({ size, png: await renderIcon(browser, size) })),
        ),
      ),
    );

    // One card per locale. A Hebrew card on an English page would be the same
    // mistake as a Hebrew page with an English price.
    for (const locale of locales) {
      write(`public/${shareImageName(locale)}`, await renderShareImage(browser, base, locale));
    }
  } finally {
    await browser.close();
  }

  console.log(written.join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
