/**
 * The checks axe cannot make: reflow, zoom, keyboard-only completion of the
 * funnel, visible focus, and WCAG 2.2 target sizes.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const out = [];
const ok = (label, pass, extra = '') => out.push(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();

// 1.4.10 Reflow: usable at 320 CSS px with no horizontal scrolling.
for (const path of ['/', '/esim/thailand', '/search?to=DE:1,US:14']) {
  const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`reflow at 320px: ${path}`, overflow <= 1, `${overflow}px overflow`);
  await page.close();
}

// 1.4.4 Resize text: 200% zoom must not clip or overlap content.
const zoomed = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await zoomed.goto(`${BASE}/esim/thailand`, { waitUntil: 'domcontentloaded' });
await zoomed.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
await zoomed.waitForTimeout(500);
const zoomOverflow = await zoomed.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('text at 200% does not force horizontal scrolling', zoomOverflow <= 1, `${zoomOverflow}px`);
await zoomed.close();

// 2.1.1 / 2.1.2 Keyboard: complete the core journey with the keyboard alone.
const kb = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await kb.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await kb.waitForTimeout(600);
await kb.getByRole('combobox', { name: 'יעד הטיול' }).focus();
await kb.keyboard.type('תאילנד', { delay: 30 });
await kb.waitForSelector('[role="listbox"]');
await kb.keyboard.press('Enter');
await kb.waitForTimeout(200);
ok('a destination can be chosen with the keyboard', (await kb.locator('form li').count()) === 1);

// The trip questions are required now, so answer them before submitting.
await kb.locator('form li input[type="number"]').first().fill('10');
await kb.locator('label:has-text("רגיל")').first().click();
await kb.waitForTimeout(150);

let reachedSubmit = false;
for (let i = 0; i < 40 && !reachedSubmit; i += 1) {
  await kb.keyboard.press('Tab');
  reachedSubmit = (await kb.evaluate(() => document.activeElement?.textContent?.trim())) === 'השוו חבילות';
}
ok('the submit button is reachable by Tab', reachedSubmit);
if (reachedSubmit) {
  await kb.keyboard.press('Enter');
  await kb.waitForURL('**/esim/thailand**');
  ok('the search can be submitted with the keyboard', true);
}

// 2.4.7 Focus visible: every tabbable element must show a focus indicator.
await kb.goto(`${BASE}/esim/thailand`, { waitUntil: 'domcontentloaded' });
await kb.waitForTimeout(600);
let checked = 0;
let invisible = [];
for (let i = 0; i < 45; i += 1) {
  await kb.keyboard.press('Tab');
  const info = await kb.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    const visible =
      (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
      s.boxShadow !== 'none' ||
      getComputedStyle(el, ':focus-visible').outlineStyle !== 'none';
    return { tag: el.tagName.toLowerCase(), text: (el.textContent ?? '').trim().slice(0, 20), visible };
  });
  if (!info) continue;
  checked += 1;
  if (!info.visible) invisible.push(`${info.tag}:${info.text}`);
}
ok('every tabbable element shows focus', invisible.length === 0, `${checked} checked, ${invisible.slice(0, 3).join(', ')}`);

// 2.5.8 Target size (minimum): 24x24 CSS px for pointer targets.
const small = await kb.evaluate(() => {
  const results = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, summary')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    // Visually hidden until focused, so not a pointer target.
    if (r.width <= 1 && r.height <= 1) continue;
    if (r.width < 24 || r.height < 24) {
      results.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent ?? '').trim().slice(0, 16)}"`);
    }
  }
  return results;
});
ok('pointer targets are at least 24x24', small.length === 0, small.slice(0, 4).join(' | '));

// 2.5.5 Target size on a phone. WCAG AA only asks for 24x24 (checked above);
// the controls a traveller actually drives the comparison with are held to
// 44x44, which is the size a thumb can hit. Secondary chrome — footer links,
// disclosure summaries — is deliberately not in this list: it meets AA and
// inflating it would push the content it sits beneath off the screen.
const thumb = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await thumb.goto(`${BASE}/esim/thailand?days=14&usage=regular`, { waitUntil: 'domcontentloaded' });
await thumb.waitForTimeout(700);
const undersized = await thumb.evaluate(() => {
  // Matched on the accessible name so the check survives a restyle.
  const wanted = [/^מעבר לאתר /, /^עוד פרטים$/, /^סינון ומיון$/, /הכי /, /^מטבע$/];
  const bad = [];
  for (const el of document.querySelectorAll('button, a[href], select')) {
    const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
    const labelled = el.labels?.[0]?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!wanted.some((re) => re.test(name) || re.test(labelled))) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.width < 44 || r.height < 44) bad.push(`${name || labelled} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return bad;
});
ok('primary mobile controls are at least 44x44', undersized.length === 0, undersized.slice(0, 5).join(' | '));
await thumb.close();

// 1.3.1 Info and relationships: exactly one H1 per page, and no level skipped
// for visual weight. A screen-reader user navigates by heading; a jump from
// H1 to H3 makes them guess whether they missed a section.
for (const path of ['/', '/esim/thailand?days=14&usage=regular', '/search?to=DE:1,US:14&usage=regular', '/accessibility', '/en']) {
  const h = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await h.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await h.waitForTimeout(500);
  const report = await h.evaluate(() => {
    // A closed <dialog> is display:none and out of the accessibility tree, so
    // its heading is not part of the document's outline.
    const rendered = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((el) => el.checkVisibility());
    const skips = [];
    let prev = 0;
    for (const el of rendered) {
      const level = Number(el.tagName[1]);
      if (prev && level > prev + 1) skips.push(`${prev}->${level} at "${el.textContent.trim().slice(0, 30)}"`);
      prev = level;
    }
    return { h1: rendered.filter((el) => el.tagName === 'H1').length, skips };
  });
  ok(`heading outline: ${path}`, report.h1 === 1 && report.skips.length === 0, `${report.h1} h1 · ${report.skips.join('; ') || 'no skips'}`);
  await h.close();
}

// 2.5.3 Label in Name, on the one control that carries the brand. The visible
// wordmark includes a question mark, and the accessible name has to start with
// exactly what is on screen — otherwise voice control cannot reach it, and a
// screen reader risks announcing the brand twice.
const bm = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const [path, wordmark] of [['/', 'יש קליטה?'], ['/en', 'Yesh Klita']]) {
  await bm.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await bm.waitForTimeout(400);
  const link = bm.locator('header a').first();
  const visible = (await link.innerText()).replace(/\s+/g, ' ').trim();
  const snapshot = await bm.accessibility.snapshot({ root: await link.elementHandle() });
  const accName = snapshot?.name ?? '';
  ok(`brand wordmark is the visible text: ${path}`, visible === wordmark, visible);
  ok(`brand accessible name starts with the wordmark: ${path}`, accName.startsWith(wordmark), accName);
  ok(`brand is not announced twice: ${path}`, accName.split(wordmark).length === 2, accName);
}
await bm.close();

// 2.3.3 / prefers-reduced-motion is honoured.
const reduced = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await reduced.goto(`${BASE}/esim/thailand`, { waitUntil: 'domcontentloaded' });
await reduced.waitForTimeout(400);
const durations = await reduced.evaluate(() =>
  [...document.querySelectorAll('*')]
    .map((el) => parseFloat(getComputedStyle(el).transitionDuration) || 0)
    .filter((d) => d > 0.05).length,
);
ok('reduced motion removes transitions', durations === 0, `${durations} elements still animate`);
await reduced.close();

// 3.3.1 Error identification: the empty-search error must be announced.
const err = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await err.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await err.waitForTimeout(600);
await err.getByRole('button', { name: 'השוו חבילות' }).click();
await err.waitForTimeout(300);
const live = await err.locator('[aria-live="polite"]').first().innerText();
ok('an empty search states the error in a live region', live.trim().length > 0, live.trim());
await err.close();

await kb.close();
await browser.close();
console.log(out.join('\n'));
process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0);
