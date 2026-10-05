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
for (const path of ['/', '/esim/thailand', '/search?to=DE:1,US:14', '/devices', '/esim', '/privacy', '/car-rental?country=FR&pickup=Paris%20CDG']) {
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

// 1.4.4 on a phone: the desktop check above has room to spare, and missed the
// usage options, the related-destination links and the home wordmark, which
// all pushed a 390px screen sideways at 200% text.
for (const path of ['/', '/esim/thailand', '/en/esim/thailand', '/search?to=TH:10']) {
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await phone.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await phone.waitForTimeout(400);
  const phoneOverflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(`text at 200% on a 390px phone: ${path}`, phoneOverflow <= 1, `${phoneOverflow}px overflow`);
  await phone.close();
}

// A phone must be able to change language without opening anything. The
// switcher once sat in a `hidden sm:block` wrapper, so below 640px there was
// no way out of the Hebrew site at all — and someone who cannot read Hebrew
// will not guess that the menu hides it. Checked in both directions, then the
// same switch through the menu.
for (const [path, name, expected] of [['/esim/thailand', 'English', '/en/esim/thailand'], ['/en/esim/thailand', 'עברית', '/esim/thailand']]) {
  const phone = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await phone.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  const link = phone.locator('header').getByRole('link', { name, exact: true });
  const visible = await link.isVisible().catch(() => false);
  const box = visible ? await link.boundingBox() : null;
  if (visible) await Promise.all([phone.waitForURL(BASE + expected), link.click()]);
  ok(`language switch visible in the phone header: ${path}`, visible && phone.url() === BASE + expected, visible ? phone.url() : 'no visible link');
  ok(`phone language switch is 44px tall: ${path}`, !!box && box.height >= 44, box ? `${Math.round(box.height)}px` : 'missing');
  await phone.close();
}
{
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(BASE + '/esim/thailand', { waitUntil: 'domcontentloaded' });
  await phone.locator('header button[aria-expanded]').click();
  const inMenu = phone.locator('dialog[open]').getByRole('link', { name: 'English', exact: true });
  const shown = await inMenu.isVisible().catch(() => false);
  if (shown) await Promise.all([phone.waitForURL(BASE + '/en/esim/thailand'), inMenu.click()]);
  const closed = await phone.evaluate(() => !document.querySelector('dialog[open]'));
  ok('language switch in the phone menu, and the menu closes after it', shown && closed && phone.url().endsWith('/en/esim/thailand'), phone.url());
  await phone.close();
}

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

// Forward from the usage choice, through the rest of the page and round to
// the search's own button; the bound grows with the page (the photographs
// of destinations to explore added nine stops).
let reachedSubmit = false;
for (let i = 0; i < 80 && !reachedSubmit; i += 1) {
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
  const wanted = [/^לחבילה באתר /, /^עוד פרטים$/, /^סינון ומיון$/, /הכי /, /^מטבע$/];
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
for (const path of ['/', '/esim/thailand?days=14&usage=regular', '/search?to=DE:1,US:14&usage=regular', '/accessibility', '/about', '/en/about', '/guides', '/guides/choose', '/guides/how-much-data', '/en/guides/install', '/disclosure', '/privacy', '/en/privacy', '/terms', '/devices', '/en/devices', '/esim', '/en/esim', '/car-rental?country=FR&pickup=Paris%20CDG', '/en']) {
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

// 1.4.12 Text spacing: the spacing a reader's own stylesheet may impose must
// not cut text off or push the page sideways.
const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
for (const path of ['/', '/esim/thailand?days=10&usage=regular', '/search?to=DE:1,US:14&usage=regular', '/accessibility']) {
  const sp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await sp.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
  await sp.addStyleTag({ content: SPACING });
  await sp.waitForTimeout(300);
  const result = await sp.evaluate(() => {
    const clipped = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.sr-only') || !el.offsetParent || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      const hides = [cs.overflow, cs.overflowX, cs.overflowY].includes('hidden');
      if (hides && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)) clipped.push(el.textContent.trim().slice(0, 30));
    }
    return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, clipped };
  });
  ok(`text spacing keeps text whole: ${path}`, result.overflow <= 1 && result.clipped.length === 0, `${result.overflow}px overflow; clipped: ${result.clipped.join(' | ')}`);
  await sp.close();
}

// 2.4.11 Focus not obscured: the header is sticky, so a control reached by
// Shift+Tab used to scroll to the top of the window and sit behind it.
const fo = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await fo.goto(`${BASE}/esim/thailand?days=10&usage=regular`, { waitUntil: 'networkidle' }).catch(() => {});
const hiddenFocus = [];
const underHeader = () => fo.evaluate(() => {
  const el = document.activeElement;
  const header = document.querySelector('header');
  if (!el || el === document.body || !header || header.contains(el) || el.matches('a[href="#main"]')) return null;
  const a = el.getBoundingClientRect();
  return a.top < header.getBoundingClientRect().bottom - 1 ? (el.textContent || el.tagName).trim().slice(0, 30) : null;
});
for (let i = 0; i < 45; i++) { await fo.keyboard.press('Tab'); const r = await underHeader(); if (r) hiddenFocus.push(r); }
for (let i = 0; i < 45; i++) { await fo.keyboard.press('Shift+Tab'); const r = await underHeader(); if (r) hiddenFocus.push('back: ' + r); }
ok('focus is never hidden under the sticky header', hiddenFocus.length === 0, hiddenFocus.slice(0, 4).join(' | '));
await fo.close();

// 2.4.2 Page titled: a search names its trip, not the home page.
const tt = await browser.newPage();
await tt.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const homeTitle = await tt.title();
await tt.goto(`${BASE}/search?to=DE:1,US:14`, { waitUntil: 'domcontentloaded' });
const searchTitle = await tt.title();
ok('a search has its own page title', searchTitle !== homeTitle && searchTitle.includes('גרמניה'), searchTitle);
await tt.close();

// 2.3.3 again, for the first screen's moving route: nothing keeps moving.
const rm = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await rm.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await rm.waitForTimeout(400);
const running = await rm.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getTiming().duration ?? 0) > 50).length);
ok('reduced motion stops the home page animation', running === 0, `${running} running`);
await rm.close();

// 2.4.7 / 1.4.11 The focus ring must be visible against what is behind it:
// sky on the night ground, action blue on light ground — including a white
// card that sits on the night ground, where sky would all but vanish.
const ring = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const weakRings = [];
for (const path of ['/', '/esim/thailand?days=10&usage=regular', '/about', '/unlock']) {
  await ring.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
  for (let i = 0; i < 60; i++) {
    await ring.keyboard.press('Tab');
    const r = await ring.evaluate(async () => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // Buttons fade their colours in (transition-colors includes the
      // outline); read the ring once it has arrived, as a person would see it.
      await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {})));
      const cs = getComputedStyle(el);
      if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0) return null;
      // Computed colours come back as rgb(), oklab() or color(srgb …) depending
      // on how Tailwind wrote them; a canvas turns any of them into 0–255.
      const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
      const rgb = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
      const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      // The ring is drawn outside the element, so the background that matters is its parent's.
      let node = el.parentElement, bg = null;
      while (node) { const c = rgb(getComputedStyle(node).backgroundColor); if (c[3] > 0.9) { bg = c; break; } node = node.parentElement; }
      if (!bg) bg = [255, 255, 255];
      const a = lum(rgb(cs.outlineColor)), b = lum(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return ratio < 3 ? `${(el.textContent || el.tagName).trim().slice(0, 24)} ${ratio.toFixed(1)}:1` : null;
    });
    if (r) weakRings.push(`${path} ${r}`);
  }
}
ok('the focus ring stands out from its background (3:1)', weakRings.length === 0, [...new Set(weakRings)].slice(0, 4).join(' | '));
await ring.close();

// A mistyped address gets the site's own page, with a 404 status.
const nf = await browser.newPage();
const nfResponse = await nf.goto(BASE + '/no-such-page', { waitUntil: 'domcontentloaded' });
const nfHeading = await nf.locator('h1').first().innerText().catch(() => '');
const nfHeader = await nf.locator('header').count();
ok('an unknown address shows the site 404 page', nfResponse?.status() === 404 && nfHeader === 1 && nfHeading.length > 0, `${nfResponse?.status()} · ${nfHeading}`);
await nf.close();

// What a screen reader is told along the search (5 October 2026). The site
// has not been tested with a real screen reader; these hold the parts of
// that experience a browser exposes: names, headings, live announcements.
const sr = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await sr.addInitScript(() => {
  window.__said = [];
  new MutationObserver(() => {
    for (const r of document.querySelectorAll('[aria-live]:not([aria-live="off"]),[role="status"],[role="alert"]')) {
      const t = r.textContent.trim();
      if (t && r.dataset.said !== t) { r.dataset.said = t; window.__said.push(t); }
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
});
await sr.goto(BASE + '/', { waitUntil: 'networkidle' });
await sr.getByRole('combobox', { name: 'יעד הטיול' }).focus();
await sr.keyboard.type('תאילנד', { delay: 30 });
await sr.waitForSelector('[role="listbox"]');
await sr.keyboard.press('Enter');
await sr.waitForTimeout(400);
const saidOnAdd = await sr.evaluate(() => window.__said.join(' | '));
ok('choosing a destination is announced', /תאילנד/.test(saidOnAdd) && /נוסף לטיול/.test(saidOnAdd), saidOnAdd.slice(0, 120));
const daysName = await sr.getByRole('spinbutton').first().evaluate((el) => el.labels?.[0]?.innerText ?? '');
const daysAccName = await sr.getByRole('spinbutton', { name: 'לכמה ימים בתאילנד?' }).count();
ok('the days field is named once, with its question', daysAccName === 1, daysName.replace(/\s+/g, ' '));
await sr.goto(`${BASE}/esim/thailand?to=TH:10&usage=regular`, { waitUntil: 'networkidle' });
await sr.waitForTimeout(1200);
const saidOnResults = await sr.evaluate(() => window.__said.join(' | '));
ok('the number of plans found is announced', /נמצא/.test(saidOnResults), saidOnResults.slice(0, 120));
const cards = await sr.evaluate(() => [...document.querySelectorAll('main article')].map((a) => {
  const h = document.getElementById(a.getAttribute('aria-labelledby') || '');
  return h && /^H[34]$/.test(h.tagName) && h.textContent.trim().length > 3;
}));
ok('every plan card is named by its own heading', cards.length > 0 && cards.every(Boolean), `${cards.filter(Boolean).length}/${cards.length}`);
const described = await sr.evaluate(() => [...document.querySelectorAll('main article button, main article a[href]')]
  .filter((el) => /עוד פרטים|לחבילה באתר/.test(el.textContent))
  .every((el) => { const id = el.getAttribute('aria-describedby'); return id && document.getElementById(id); }));
ok('repeated card buttons say which plan they belong to', described);
const slider = sr.getByRole('slider').first();
const valueText = (await slider.count()) ? await slider.getAttribute('aria-valuetext') : null;
ok('the price slider reads a price, not a raw number', !!valueText && /[₪$€£]/.test(valueText), String(valueText));
await sr.close();

await kb.close();
await browser.close();
console.log(out.join('\n'));
process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0);
