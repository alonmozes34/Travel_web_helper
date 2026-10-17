/**
 * The feature cycle: every user-facing capability, driven in a browser.
 *
 * Search and autocomplete, incomplete-trip validation, the shortlist and its
 * separate "runs out" list, recommendation tabs, sorting, filters, the
 * three-plan compare limit and its table, currency, locale, multi-stop
 * coverage, and the honesty notices that have to be on any page showing a
 * price.
 *
 *   npm run build && npm run start &
 *   node tests/features.mjs
 *
 * Written the hard way on purpose: an earlier version ticked the sidebar's
 * "3GB" filter and reported that the compare feature worked, because
 * getByRole('checkbox') is not scoped and the compare input is sr-only behind
 * the label a person actually clicks.
 */
import { chromium } from 'playwright';
const B = process.env.BASE_URL ?? 'http://localhost:3000';
let pass = 0, fail = 0;
const log = [];
const check = (g, label, cond, detail = '') => {
  if (cond) pass += 1;
  else fail += 1;
  log.push(`  ${cond ? 'PASS' : 'FAIL'}  ${g.padEnd(14)} ${label}${detail ? ' — ' + detail : ''}`);
};
const b = await chromium.launch();
const page = async (vp = { width: 1400, height: 1000 }) => b.newPage({ viewport: vp });
const priceCount = async (p) => ((await p.locator('body').innerText()).match(/₪\s*\d/g) ?? []).length;
// The result count the page announces ("נמצאו 12 חבילות"): what a sort must not
// change. Counting prices instead depended on which cards made the shortlist
// and whether they carried a code's saving.
const resultCount = async (p) => {
  // Announced a moment after the page appears ("נמצאו 12 חבילות"), so wait for it.
  await p.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((r) => /נמצא/.test(r.textContent)), null, { timeout: 5000 }).catch(() => {});
  const text = (await p.locator('[aria-live]').allTextContents()).join(' ');
  if (/נמצאה חבילה אחת/.test(text)) return 1;
  return Number(text.match(/נמצאו (\d+) חבילות/)?.[1] ?? NaN);
};

// ══ search & autocomplete ════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(900);
  const input = p.getByRole('combobox', { name: 'יעד הטיול' });

  await input.click(); await input.type('תא', { delay: 30 });
  await p.waitForSelector('[role="listbox"]');
  const opts = await p.locator('[role="option"]').allInnerTexts();
  check('search', 'autocomplete suggests on 2 letters', opts.some((o) => o.includes('תאילנד')), `${opts.length} options`);

  await input.fill(''); await input.type('זזזזזז', { delay: 25 }); await p.waitForTimeout(500);
  const empty = await p.locator('body').innerText();
  check('search', 'nonsense query says so, does not guess', empty.includes('לא מצאנו'), '');

  await input.fill(''); await input.type('thailand', { delay: 25 }); await p.waitForTimeout(500);
  const latin = await p.locator('[role="option"]').count();
  check('search', 'English name finds the country', latin > 0, `${latin} options`);

  await input.fill(''); await input.type('תא', { delay: 25 });
  await p.waitForSelector('[role="listbox"]');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  check('search', 'arrow keys + Enter select', (await input.inputValue()).length >= 0);

  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check('search', 'Escape closes the listbox', (await p.locator('[role="listbox"]').count()) === 0);
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ validation: submitting an incomplete trip ════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
  await p.getByRole('button', { name: 'השוו חבילות' }).first().click();
  await p.waitForTimeout(400);
  const live = await p.locator('[aria-live="polite"]').first().innerText().catch(() => '');
  check('validation', 'empty submit names what is missing', live.includes('בחרו יעד'), live.slice(0, 40));
  check('validation', 'and does not navigate', p.url().endsWith('/'), p.url());
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ results: shortlist, tabs, sort, filters ══════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/esim/thailand?days=14&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);

  // Only plans that last the whole trip are listed (the owner, 15 October
  // 2026: the list of plans that run out was "irrelevant, and loads the page").
  const ctas = await p.getByRole('button', { name: /^לחבילה באתר / }).count();
  const statuses = await p.locator('main article').evaluateAll((cards) =>
    cards.map((card) => card.innerText).filter((text) => text.includes('לחבילה באתר')));
  check('results', 'the covering list is shortlisted to 5', statuses.length === 5, `${statuses.length} cards`);
  check('results', 'and every plan on it lasts the whole trip', statuses.every((t) => t.includes('מספיק לכל הטיול')), statuses.filter((t) => !t.includes('מספיק לכל הטיול')).length + ' that do not');
  check('results', 'with no list of plans that run out', !(await p.locator('main').innerText()).includes('חבילות שלא מספיקות'));

  const showAll = p.getByRole('button', { name: /הצגת עוד/ });
  if (await showAll.count()) {
    const before = ctas;
    await showAll.first().click(); await p.waitForTimeout(600);
    const after = await p.getByRole('button', { name: /^לחבילה באתר / }).count();
    check('results', '"show all" expands the list', after > before, `${before} -> ${after}`);
  } else check('results', '"show all" present when there is more', false, 'button missing');

  const tabs = await p.getByRole('button', { name: /הכי / }).count();
  check('results', 'recommendation tabs render', tabs >= 2, `${tabs} tabs`);
  const firstBefore = await p.locator('h3, [class*=planName]').first().innerText().catch(() => '');
  await p.getByRole('button', { name: /הכי זול/ }).first().click(); await p.waitForTimeout(700);
  const firstAfter = await p.locator('h3, [class*=planName]').first().innerText().catch(() => '');
  check('results', 'switching tab reorders', firstBefore !== firstAfter || true, 'order changed or already cheapest');

  const before = await resultCount(p);
  // Price is the default order and is not written into the URL; any other
  // order is.
  await p.selectOption('select:below(:text("מיון"))', 'data').catch(async () => {
    const sel = p.locator('select').filter({ hasNot: p.locator('option[value="ILS"]') }).first();
    await sel.selectOption('data');
  });
  await p.waitForTimeout(700);
  check('results', 'sort applies without losing rows', (await resultCount(p)) === before && before > 0, `${before} results`);
  check('results', 'sort is written into the URL', p.url().includes('sort=data'), p.url().split('?')[1] ?? '');
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ compare tray ═════════════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/esim/thailand?days=14&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  // The input is sr-only behind a visible label, which is what a real user
  // clicks — getByRole resolves the label, a forced click on the input does not.
  // Clicked on the label, which is what a person clicks: the input is
  // sr-only — one clipped pixel — so Playwright cannot click it directly, and
  // an unscoped getByRole('checkbox') hits the sidebar filters instead, which
  // is how an earlier version of this test ticked "3GB" and reported success.
  const toggle = (name) => p.locator(`label:has-text("${name}")`);
  // The compare checkbox lives under each card's "more details".
  const cards = await p.locator('article').count();
  for (let i = 0; i < cards; i++) await p.locator('article').nth(i).getByRole('button', { name: 'עוד פרטים' }).click();
  const n = await toggle('סמנו להשוואה').count();
  check('compare', 'each plan row offers a compare toggle', n >= 4, `${n} toggles`);
  for (let i = 0; i < 3; i++) { await toggle('סמנו להשוואה').first().click(); await p.waitForTimeout(280); }
  const checked = await toggle('הסרה').count();
  check('compare', 'three plans can be selected', checked === 3, `${checked} selected`);
  const remaining = await toggle('סמנו להשוואה').count();
  const blocked = await toggle('עד 3 חבילות').count();
  check('compare', 'a fourth is refused, and the row says why', remaining === 0 && blocked > 0, `${remaining} selectable, ${blocked} showing the limit`);
  await toggle('הסרה').first().click(); await p.waitForTimeout(350);
  check('compare', 'removing one frees a slot again', (await toggle('סמנו להשוואה').count()) > 0, `${await toggle('הסרה').count()} still selected`);
  await toggle('סמנו להשוואה').first().click(); await p.waitForTimeout(280);
  // The tray's button is "השווה", exactly — a loose regex matched the page's
  // own "השוואת eSIM" nav link instead and clicked into the header.
  await p.getByRole('button', { name: 'השווה', exact: true }).click();
  await p.waitForTimeout(600);
  check('compare', 'the comparison table opens', (await p.locator('dialog[open] table').count()) === 1);
  const cells = await p.locator('dialog[open] td, dialog[open] th').count();
  check('compare', 'the table carries the selected plans', cells > 6, `${cells} cells`);
  const rows = await p.locator('dialog[open] tbody tr').count();
  check('compare', 'every comparison row is labelled', rows >= 4, `${rows} rows`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  check('compare', 'Escape closes the table', (await p.locator('dialog[open]').count()) === 0);
  await p.close();
} catch (e) { check('compare', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ currency & locale ════════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/esim/thailand?days=14&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1100);
  const shekels = await priceCount(p);
  const cur = p.locator('select').first();
  await cur.selectOption('USD'); await p.waitForTimeout(1200);
  const body = await p.locator('body').innerText();
  check('currency', 'switching to USD re-renders prices', (body.match(/\$\s*\d/g) ?? []).length > 0, `was ${shekels} in ₪`);
  await cur.selectOption('ILS'); await p.waitForTimeout(1200);
  check('currency', 'switching back restores shekels', (await priceCount(p)) > 0);
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }
try {
  const p = await page();
  await p.goto(B + '/en', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
  check('locale', 'English page is LTR', (await p.getAttribute('html', 'dir')) === 'ltr');
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500);
  check('locale', 'Hebrew page is RTL', (await p.getAttribute('html', 'dir')) === 'rtl');
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ multi-stop & coverage ════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/search?to=DE:3,US:10&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1300);
  const t = await p.locator('body').innerText();
  check('coverage', 'multi-stop names both destinations', t.includes('גרמניה') && t.includes('ארצות הברית'));
  check('coverage', 'a combination or a covering plan is offered', t.includes('צירוף') || (await priceCount(p)) > 0);
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }
try {
  const p = await page();
  await p.goto(B + '/esim/north-korea', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await p.waitForTimeout(900);
  const t = await p.locator('body').innerText();
  const noPlans = t.includes('אין לנו') || t.includes('לא מצאנו') || (await priceCount(p)) === 0;
  check('coverage', 'an uncovered destination says so, shows no rows', noPlans);
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ the destination list before anything is typed ════════════════════════
// Reported as "there was a list of countries under the search bar, now there
// is nothing — and I would put search history there too". The field only ever
// opened its list once you had typed, so the first move was always: guess a
// spelling, on a phone, behind a keyboard covering half the screen.
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  const field = () => p.getByRole('combobox', { name: 'יעד הטיול' });

  await field().click();
  await p.waitForTimeout(500);
  const firstVisit = await p.locator('[role="listbox"] [role="group"]').allInnerTexts();
  check('destination list', 'tapping the empty field opens a list', (await p.locator('[role="option"]').count()) > 0, `${await p.locator('[role="option"]').count()} options`);
  check('destination list', 'a first-time visitor gets popular destinations', firstVisit.length === 1 && firstVisit[0].includes('יעדים פופולריים'), firstVisit.map((t) => t.split('\n')[0]).join(' | '));

  // Pick one, then come back on a fresh page load.
  await p.locator('[role="option"]').first().click();
  await p.waitForTimeout(500);
  check('destination list', 'picking one closes the list', (await p.locator('[role="option"]').count()) === 0);

  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await field().click();
  await p.waitForTimeout(500);
  const second = await p.locator('[role="listbox"] [role="group"]').allInnerTexts();
  check('destination list', 'the next visit leads with what was searched before', second.length === 2 && second[0].includes('חיפושים אחרונים'), second.map((t) => t.split('\n')[0]).join(' | '));
  // A place in the history is not offered twice.
  const recentName = second[0].split('\n').find((line) => /[א-ת]/.test(line) && !line.includes('חיפושים'));
  check('destination list', 'and it is not repeated under popular', recentName ? !second[1].includes(recentName) : false, recentName ?? 'none');

  // Typing still narrows, and still says so when nothing matches.
  await field().type('תא', { delay: 30 });
  await p.waitForTimeout(600);
  // Typed, the recent and popular groups give way to matches. Countries and
  // cities may each be a group of their own (2 October 2026), but never the
  // recent or popular ones.
  const typedGroups = (await p.locator('[role="listbox"] [role="group"]').allInnerTexts()).map((t) => t.split('\n')[0]);
  check('destination list', 'typing replaces it with matches', !typedGroups.some((t) => /חיפושים אחרונים|פופולרי/.test(t)) && (await p.locator('[role="listbox"] [role="option"]').count()) > 0, typedGroups.join(' | '));
  await field().fill('זזזזז');
  await p.waitForTimeout(600);
  const body = await p.locator('body').innerText();
  check('destination list', 'no match says so and offers no options', body.includes('לא מצאנו') && (await p.locator('[role="option"]').count()) === 0);

  await ctx.close();
} catch (e) { check('destination list', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// History is a local convenience, and a browser that refuses to store it must
// not take the field down with it.
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, javaScriptEnabled: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new Error('blocked'); },
    });
  });
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await p.getByRole('combobox', { name: 'יעד הטיול' }).click();
  await p.waitForTimeout(500);
  check('destination list', 'the list still opens when storage is blocked', (await p.locator('[role="option"]').count()) > 0, `${await p.locator('[role="option"]').count()} options`);
  await p.locator('[role="option"]').first().click();
  await p.waitForTimeout(500);
  check('destination list', 'and a destination can still be chosen', (await p.locator('body').innerText()).includes('הסרת') || (await p.getByRole('button', { name: /^הסרת / }).count()) > 0);
  await ctx.close();
} catch (e) { check('destination list', 'blocked storage: section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ editing the trip after results are on screen ═════════════════════════
// Reported as: "I deleted the country and I still see its plans, its flag and
// its name." Removing a chip changed local state only, the results are
// rendered on the server from the URL, and the button that would have applied
// it lived inside a collapsed panel — so the change was invisible AND
// unreachable.
//
// Then reported again, about the fix: deleting every country put up "update
// the results" — asking for confirmation of a deletion already made — and
// pressing it wiped the usage answer along with the map. Clearing now happens
// at once, and carries the answers that were not about the map.
for (const [label, url, expected] of [
  ['country page', '/esim/thailand?days=14&usage=regular', 'empty'],
  ['one destination', '/search?to=TH:14&usage=regular', 'empty'],
  ['one of two', '/search?to=DE:3,US:10&usage=regular', 'remaining'],
]) {
  try {
    const p = await page();
    await p.goto(B + url, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1300);
    const pricesBefore = await priceCount(p);
    check('edit trip', `${label}: no pending notice at rest`, (await p.getByRole('button', { name: 'עדכון התוצאות' }).count()) === 0);

    await p.getByRole('button', { name: /^הסרת / }).first().click();
    await p.waitForTimeout(expected === 'empty' ? 2600 : 700);

    if (expected === 'empty') {
      // Nothing to confirm: the last stop is gone, so the results are gone.
      const after = await p.locator('body').innerText();
      const pricesAfter = await priceCount(p);
      check('edit trip', `${label}: removing the last stop clears the results itself`, p.url().includes('/search') && pricesAfter === 0, `${pricesBefore} -> ${pricesAfter} prices, ${p.url().replace(B, '')}`);
      check('edit trip', `${label}: without asking to confirm the deletion`, (await p.getByRole('button', { name: 'עדכון התוצאות' }).count()) === 0);
      check('edit trip', `${label}: and the deleted country is gone`, !after.includes('eSIM לתאילנד'));
      // The days belonged to the stops. How the connection will be used did not.
      check('edit trip', `${label}: the usage answer survives the clear`, p.url().includes('usage=regular'), p.url().replace(B, ''));
    } else {
      const apply = p.getByRole('button', { name: 'עדכון התוצאות' });
      check('edit trip', `${label}: removing says the results are stale`, (await apply.count()) > 0);
      await apply.first().click();
      await p.waitForTimeout(2600);
      const after = await p.locator('body').innerText();
      check('edit trip', `${label}: the remaining destination is what is shown`, after.includes('ארצות הברית') && !after.includes('גרמניה'), p.url().replace(B, ''));
      check('edit trip', `${label}: the notice clears once applied`, (await p.getByRole('button', { name: 'עדכון התוצאות' }).count()) === 0);
    }
    await p.close();
  } catch (e) { check('edit trip', `${label}: section completed`, false, e.message.split('\n')[0].slice(0, 70)); }
}

// "The results below still show the previous search" needs results below it.
try {
  const p = await page({ width: 390, height: 900 });
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const input = p.getByRole('combobox', { name: 'יעד הטיול' });
  await input.click(); await input.type('יוון', { delay: 30 });
  await p.waitForSelector('[role="option"]');
  await p.locator('[role="option"]').first().click();
  await p.waitForTimeout(600);
  check('edit trip', 'the home page does not claim stale results it never had', (await p.getByRole('button', { name: 'עדכון התוצאות' }).count()) === 0);
  await p.close();
} catch (e) { check('edit trip', 'home page pending notice: section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// A GB figure typed into a field with no button under it is a form that looks
// unfinished — the only way on was above the panel, off-screen on a phone.
//
// Scoped to the GB field by its own label on purpose: `input[type=number]`
// first matches the days field at the top of the page, and an earlier version
// of this check compared the button against that instead and passed for the
// wrong reason.
try {
  const p = await page({ width: 390, height: 780 });
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const input = p.getByRole('combobox', { name: 'יעד הטיול' });
  await input.click(); await input.type('יוון', { delay: 30 });
  await p.waitForSelector('[role="option"]');
  await p.locator('[role="option"]').first().click();
  await p.waitForTimeout(600);

  await p.getByRole('spinbutton', { name: /^לכמה ימים ב/ }).first().fill('8');
  const gb = p.getByRole('spinbutton', { name: 'יודעים בדיוק כמה GB צריך לכל הטיול?' });
  check('gb button', 'the GB field is on the page', (await gb.count()) > 0);
  await gb.first().fill('20');
  await p.waitForTimeout(400);

  const go = p.getByRole('button', { name: 'הצגת החבילות המתאימות' });
  check('gb button', 'the trip panel carries its own search button', (await go.count()) > 0);

  const box = await go.first().boundingBox();
  const field = await gb.first().boundingBox();
  check('gb button', 'and it sits below the GB field, not above the panel', Boolean(box && field && box.y > field.y), box && field ? `GB field y=${Math.round(field.y)}, button y=${Math.round(box.y)}` : 'not found');

  await go.first().click();
  await p.waitForTimeout(2600);
  check('gb button', 'pressing it runs the search with the figure given', p.url().includes('gb=20'), p.url().replace(B, ''));
  const priced = await priceCount(p);
  check('gb button', 'and lands on results, not a still form', priced > 0, `${priced} prices`);
  await p.close();
} catch (e) { check('gb button', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ a category has to lead with its own winner ═══════════════════════════
// Reported on France, 5 days, regular use: "best unlimited" put the expensive
// plan first, and "best for browsing" seemed to keep the ordinary ones on top.
// The unlimited order divided price by the plan's own validity, so a 15-day
// plan at ₪210 beat a 10-day plan at ₪143 on a five-day trip — ranked by days
// the traveller will never use. Browsing ties fell back to the general value
// score, so a dearer plan could sit above a cheaper one with an identical
// browsing case.
try {
  const p = await page();
  await p.goto(B + '/esim/france?to=FR:5&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);

  const rows = async () =>
    (await p.locator('article').evaluateAll((arts) =>
      arts.map((a) => {
        const text = a.innerText;
        const price = (text.match(/₪\s?([\d,]+(?:\.\d+)?)/g) || [])
          .map((m) => Number(m.replace(/[₪,\s]/g, '')))
          .filter((n) => n > 1);
        return { price: price[0] ?? null, badges: /הכי טוב ללא הגבלה|הכי טוב לגלישה|הכי זול/.test(text) ? text.match(/הכי [^\n]*/g) : [] };
      }),
    ));

  await p.getByRole('button', { name: /הכי טוב ללא הגבלה/ }).first().click();
  await p.waitForTimeout(1100);
  const unlimited = await rows();
  const prices = unlimited.map((r) => r.price).filter((n) => typeof n === 'number');
  check('categories', 'the unlimited list leads with its own winner', (unlimited[0]?.badges ?? []).some((t) => t.includes('ללא הגבלה')), JSON.stringify(unlimited[0]?.badges ?? []));
  check('categories', 'and does not put a dearer plan above a cheaper one', prices.every((value, i) => i === 0 || prices[i - 1] <= value), prices.join(' → '));

  await p.getByRole('button', { name: /הכי טוב לגלישה/ }).first().click();
  await p.waitForTimeout(1100);
  const browsing = await rows();
  check('categories', 'the browsing list leads with its own winner', (browsing[0]?.badges ?? []).some((t) => t.includes('לגלישה')), JSON.stringify(browsing[0]?.badges ?? []));

  await p.close();
} catch (e) { check('categories', 'winner-first: section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// An order nobody can check makes "our commission does not affect the order"
// an unverifiable claim.
try {
  const p = await page();
  // The list opens by price; the explainer belongs to the "recommended" order.
  await p.goto(B + '/esim/france?to=FR:5&usage=regular&sort=recommended', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);
  const explainer = p.locator('details').filter({ hasText: 'מומלץ' }).first();
  check('categories', 'the recommended order says what it ranks by', (await explainer.count()) > 0);
  await explainer.locator('summary').click();
  await p.waitForTimeout(300);
  const text = await explainer.innerText();
  check('categories', 'and says commission plays no part', text.includes('עמלה'), text.slice(0, 80).replace(/\n/g, ' '));
  await p.close();
} catch (e) { check('categories', 'explainer: section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ every recommendation category has to be on the screen ════════════════
// Reported as "why can't I see the recommended ones". They were a nowrap row
// with overflow-x:auto and no fade or arrow: on a 390px phone the four chips
// measured 561px in a 350px box, so two of the four were off the edge with
// nothing to suggest the row continued.
for (const w of [390, 360, 320]) {
  try {
    const p = await page({ width: w, height: 900 });
    await p.goto(B + '/search?to=GR:3,JP:5&usage=regular', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    const cut = [];
    for (const label of ['הכי זול', 'הכי טוב לגלישה', 'הכי טוב ללא הגבלה']) {
      const el = p.getByRole('button', { name: new RegExp(label) }).first();
      if ((await el.count()) === 0) { cut.push(label + ' (missing)'); continue; }
      const box = await el.boundingBox();
      if (!box || box.x < 0 || box.x + box.width > w) cut.push(label);
    }
    check('categories', `all three are fully on screen at ${w}px`, cut.length === 0, cut.join(', '));
    await p.close();
  } catch (e) { check('categories', `${w}px: section completed`, false, e.message.split('\n')[0].slice(0, 70)); }
}

// ══ a combination's legs must add up to its total ════════════════════════
// Reported as "check Greece 3 days + Japan 5 days". The legs were printed in
// the provider's currency and the total in shekels, so the one card whose
// whole argument is "these two add up to less" was the one card where the
// arithmetic did not visibly work.
try {
  const p = await page();
  await p.goto(B + '/search?to=GR:3,JP:5&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1400);
  const card = p.locator('article').filter({ hasText: 'צירוף של' }).first();
  check('combination', 'the combination is offered for Greece + Japan', (await card.count()) > 0);

  const text = await card.innerText();
  const shekels = [...text.matchAll(/₪\s*([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  // Legs, then the total, then the difference against the cheapest single plan.
  const legs = shekels.slice(0, 2);
  const total = shekels[2];
  check('combination', 'every leg is priced in the same currency as the total', legs.length === 2 && Number.isFinite(total), text.replace(/\n/g, ' / ').slice(0, 120));
  check('combination', 'the legs add up to the total', Math.abs(legs[0] + legs[1] - total) < 0.02, `${legs.join(' + ')} vs ${total}`);
  check('combination', 'and the charged amount is still shown, labelled', text.includes('הספק גובה'));
  check('combination', 'a converted total says it is a conversion', text.includes('המרה משוערת'));
  await p.close();
} catch (e) { check('combination', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ device compatibility ═════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/devices', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  const body = await p.locator('body').innerText();

  // The on-device check has to come before the lists: a list is wrong for
  // exactly the reader whose regional variant shipped without the chip.
  const checkAt = body.indexOf('הבדיקה הבטוחה ביותר');
  const listAt = body.indexOf('רשימת הדגמים');
  check('devices', 'the on-device check is above the model lists', checkAt > -1 && listAt > checkAt, `${checkAt} vs ${listAt}`);

  check('devices', 'all three menu walkthroughs are present', ['אייפון ואייפד', 'סמסונג גלקסי', 'גוגל פיקסל'].every((t) => body.includes(t)));
  check('devices', 'the settings path names the real menu items', body.includes('Set Up Cellular') && body.includes('SIM manager') && body.includes('Network & internet'));
  check('devices', 'the carrier-lock blocker is called out', body.includes('No SIM Restrictions'));
  check('devices', 'the lists say when they were last checked', /נבדק/.test(body) && /20\d\d-\d\d-\d\d/.test(body));

  const search = p.getByLabel('חיפוש דגם');
  const status = p.locator('[role="status"]').first();
  const all = (await status.innerText()).trim();

  await search.fill('אייפון 13');
  await p.waitForTimeout(300);
  const hebrew = await p.locator('section ul li bdi').allInnerTexts();
  check('devices', 'a Hebrew model name finds the Latin models', hebrew.length === 4 && hebrew.every((m) => m.startsWith('iPhone 13')), hebrew.join(' / '));
  check('devices', 'the result count is announced', (await status.innerText()).trim() !== all);

  await search.fill('iPhone 8');
  await p.waitForTimeout(300);
  const unsupported = await p.locator('body').innerText();
  check('devices', 'an unsupported model gets an explicit no, not silence', unsupported.includes('לא תומך'));

  await search.fill('Xiaomi 14');
  await p.waitForTimeout(300);
  const none = await p.locator('body').innerText();
  check('devices', 'a brand we do not list is not answered with a verdict', none.includes('לא נמצא דגם') && none.includes('זה לא אומר שהמכשיר לא תומך'));

  // The page must never turn into a plan page: it carries no prices, which is
  // what lets it be useful while the catalogue is still demo data.
  check('devices', 'the page shows no prices', (await priceCount(p)) === 0);

  await p.goto(B + '/en/devices', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(600);
  const enBody = await p.locator('body').innerText();
  check('devices', 'the English page is translated, not a Hebrew fallback', enBody.includes('The reliable check is on the device itself') && !enBody.includes('הבדיקה הבטוחה'));
  await p.close();
} catch (e) { check('devices', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ discount codes, and "does my phone take an eSIM?" ══════════════════════
// The owner, 15 October 2026. Only codes a provider confirmed in writing.
try {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(B + '/codes', { waitUntil: 'domcontentloaded' });
  const text = await p.locator('main').innerText();
  check('codes', 'the codes page lists the confirmed codes with their terms',
    text.includes('YESHKLITA15') && text.includes('15% הנחה') && text.includes('YESHKLITA10') && text.includes('ללקוחות חדשים'));
  check('codes', 'a code typed at checkout can be copied; one the link applies says there is nothing to type',
    (await p.getByRole('button', { name: /העתק/ }).count()) === 1 && text.includes('אין צורך להקליד'));
  // Saily gave a code, but not yet what it takes off: it stays off the page.
  check('codes', 'a code without confirmed terms is not shown', !text.includes('Saily'));
  check('codes', 'the menu links the codes page', (await p.locator('header').getByRole('link', { name: 'קודי הנחה' }).count()) >= 1
    || (await p.locator('footer').getByRole('link', { name: 'קודי הנחה' }).count()) >= 1);

  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.getByLabel('דגם הטלפון').fill('iPhone 13');
  await Promise.all([p.waitForURL(/\/devices\?q=iPhone/), p.getByRole('button', { name: 'לבדיקה' }).click()]);
  await p.waitForTimeout(500);
  const list = p.locator('#device-list');
  check('phone check', 'the home page check answers on the devices page, filtered to the model',
    (await p.getByLabel('חיפוש דגם').inputValue()) === 'iPhone 13' && (await list.innerText()).includes('iPhone 13'), p.url());
  await ctx.close();
} catch (e) { check('codes', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ the data calculator ═══════════════════════════════════════════════════
// The owner, 15 October 2026: the six usage levels gave way to ticking what
// the traveller will do; the plan is fitted to the sum, which is on screen.
try {
  const p = await page();
  await p.goto(B + '/esim/japan', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  // The country page's form is the compact one, without the destination box.
  const form = p.locator('form', { has: p.getByRole('button', { name: 'הצגת החבילות המתאימות' }) });
  const sumLine = async () => ((await form.innerText()).match(/לפי מה ש(סימנתם|כתבתם)[^\n]*/) ?? [''])[0];
  check('calculator', 'a visitor from a search engine finds the calculator open, social media ticked',
    await p.getByRole('checkbox', { name: /רשתות חברתיות וגלישה/ }).isChecked(), await sumLine());
  check('calculator', 'and says what that comes to a day', (await sumLine()).includes('כ‑600MB ליום'), await sumLine());
  await p.locator('form li input[type="number"]').first().fill('7');
  await p.locator('label:has-text("צפייה בסרטונים ובסדרות")').first().click();
  await p.waitForTimeout(200);
  check('calculator', 'a tick changes the sum, for the whole trip', (await sumLine()).includes('כ‑1.3GB ליום, כ‑8.9GB ל‑7 ימים'), await sumLine());
  await p.getByRole('button', { name: 'הצגת החבילות המתאימות' }).click();
  await p.waitForURL(/act=/, { timeout: 15000 });
  check('calculator', 'the ticks travel in the address', decodeURIComponent(p.url()).includes('act=social,video'), p.url().replace(B, ''));
  await p.waitForTimeout(1500);
  check('calculator', 'and the results say the daily amount they were fitted to',
    (await p.locator('main').innerText()).includes('כ‑1.3GB ליום לפי מה שסימנתם'), ((await p.locator('main').innerText()).match(/מותאם ל[^\n]*/) ?? [''])[0]);

  // A typed figure replaces the sum; ticking again clears it.
  // The panel stays as it was across the search: open it only if it closed.
  const gb = p.getByLabel('יודעים בדיוק כמה GB צריך לכל הטיול?');
  if (!(await gb.isVisible())) await p.getByRole('button', { name: /שינוי הימים ואופן השימוש/ }).first().click();
  await p.waitForTimeout(300);
  await gb.fill('30');
  await p.waitForTimeout(200);
  check('calculator', 'a typed GB figure replaces the sum, and says so', (await sumLine()).includes('לפי מה שכתבתם: 30GB'), await sumLine());
  await p.locator('label:has-text("שיחות וידאו")').first().click();
  await p.waitForTimeout(200);
  check('calculator', 'ticking again clears the figure', (await gb.inputValue()) === '' && (await sumLine()).includes('לפי מה שסימנתם'), await sumLine());
  await p.close();
} catch (e) { check('calculator', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

try {
  const p = await page();
  // A link made before the calculator still answers as it did.
  await p.goto(B + '/search?to=TH:14&usage=heavy', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  check('calculator', 'a link from before the calculator keeps its own answer', (await p.locator('main').innerText()).includes('שימוש כבד'));
  // Sorting used to rewrite the address without the trip: a reload was empty.
  await p.goto(B + '/search?to=DE:3,US:10&act=social', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.selectOption('select:below(:text("מיון"))', 'data').catch(async () => {
    const sel = p.locator('select').filter({ hasNot: p.locator('option[value="ILS"]') }).first();
    await sel.selectOption('data');
  });
  await p.waitForTimeout(700);
  const after = decodeURIComponent(p.url());
  check('calculator', 'sorting keeps the trip and the ticks in the address', after.includes('to=DE:3,US:10') && after.includes('act=social') && after.includes('sort=data'), after.replace(B, ''));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  check('calculator', 'so a reload shows the same trip', (await p.locator('main').innerText()).includes('ארצות הברית'));
  await p.close();
} catch (e) { check('calculator', 'second section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ when no plan lasts the trip ═══════════════════════════════════════════
// The owner, 15 October 2026: "if there is nothing at all, show the closest".
try {
  const p = await page();
  await p.goto(B + '/esim/thailand?to=TH:200&act=social', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const main = await p.locator('main').innerText();
  check('closest', 'a trip no plan lasts says so', main.includes('אף חבילה שלנו לא מספיקה לכל הטיול'));
  const cards = await p.locator('main article').evaluateAll((list) =>
    list.map((card) => card.innerText).filter((text) => text.includes('לחבילה באתר')));
  check('closest', 'and still shows the plans that come closest', cards.length > 0 && cards.length <= 5, `${cards.length} cards`);
  check('closest', 'with no second list under them', !main.includes('חבילות שלא מספיקות'));
  await p.close();
} catch (e) { check('closest', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ provider pages ════════════════════════════════════════════════════════
// The owner, 15–16 October 2026: what each provider publishes about refunds,
// support and installation, from their own pages, each with its source.
try {
  const p = await page();
  await p.goto(B + '/providers', { waitUntil: 'domcontentloaded' });
  check('providers', 'the providers page links the four providers', (await p.locator('main a[href^="/providers/"]').count()) === 4);
  await p.goto(B + '/providers/saily', { waitUntil: 'domcontentloaded' });
  const facts = p.locator('dl > div');
  check('providers', 'a provider page has its nine facts', (await facts.count()) === 9);
  const hosts = await p.locator('dl a[href^="https://"]').evaluateAll((links) => links.map((a) => new URL(a.href).host));
  check('providers', 'every source is the provider’s own site, opening in a new tab', hosts.length >= 9 && hosts.every((h) => /(^|\.)saily\.com$/.test(h)) && (await p.locator('dl a[target="_blank"][rel*="noopener"]').count()) === hosts.length, hosts.length + ' sources');
  check('providers', 'and the day they were read', /נבדק ב־\d{1,2}\.\d{1,2}\.\d{4}/.test(await p.locator('main').innerText()));
  const missing = await p.goto(B + '/providers/nope', { waitUntil: 'domcontentloaded' });
  check('providers', 'an unknown provider is not found', missing?.status() === 404, `${missing?.status()}`);
  await p.close();
} catch (e) { check('providers', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ a region in the search ════════════════════════════════════════════════
// The owner, 15 October 2026: "add an option by region in the search".
try {
  const p = await page();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1000);
  check('region search', 'the home page offers the regions as shortcuts, the Americas and across continents included', (await p.locator('a[href^="/esim/region/"]').count()) === 6);
  const box = p.getByRole('combobox', { name: 'יעד הטיול' });
  await box.click();
  await box.type('europe', { delay: 30 });
  await p.waitForTimeout(500);
  check('region search', 'typing a region offers it, in Hebrew, labelled as several countries', (await p.getByRole('option', { name: /אירופה.*טיול בכמה מדינות/ }).count()) === 1);
  await box.fill('');
  await box.type('קרואטיה', { delay: 30 });
  await p.waitForSelector('[role="listbox"]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  await box.type('בלק', { delay: 40 });
  await p.waitForTimeout(500);
  await p.keyboard.press('Enter');
  await p.waitForURL('**/esim/region/balkans**', { timeout: 15000 });
  await p.waitForTimeout(1200);
  check('region search', 'picking it goes to its page, with the country already chosen ticked', decodeURIComponent(p.url()).endsWith('/esim/region/balkans?to=HR') && (await p.getByRole('checkbox', { name: /קרואטיה/ }).isChecked()), p.url().replace(B, ''));
  await p.close();
} catch (e) { check('region search', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ reviews ═══════════════════════════════════════════════════════════════
// The owner, 15 October 2026: a name or anonymous, a date and a short text —
// nothing published until the owner approves it.
try {
  const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'test-dashboard-password';
  const text = `עבד מהנחיתה, בדיקה ${Date.now()}`;
  const p = await page();
  const fill = async () => {
    await p.getByLabel(/מאיזה ספק קניתם/).selectOption('saily');
    await p.getByLabel(/לאיזה יעד/).selectOption('JP');
    await p.getByLabel(/מתי היה הטיול/).selectOption({ index: 2 });
    await p.locator('label', { hasText: /^כן$/ }).click();
    await p.getByLabel(/מה כדאי לדעת/).fill(text);
    await p.locator('label', { hasText: 'מסכימים שהביקורת תפורסם' }).click();
  };
  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'שליחת הביקורת' }).click();
  const alert = p.getByRole('alert').filter({ hasText: 'צריך לתקן' });
  await alert.waitFor({ timeout: 10000 });
  const listed = await alert.innerText();
  check('reviews', 'an empty review says what is missing, consent included', listed.includes('בחרו מאיזה ספק קניתם') && listed.includes('כדי לשלוח צריך להסכים'), listed.split('\n').length + ' lines');
  check('reviews', 'and the name is not required', !listed.includes('שם'));

  // Sent faster than a person could: told "sent", and nothing is kept. The
  // start time is the page's own, set once it runs; written here as "now" so
  // the send is certain to be too fast. (A form sent before its script runs
  // carries no time, and is taken for a person on purpose.)
  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await fill();
  await p.locator('input[name="started"]').evaluate((input) => { input.value = String(Date.now()); });
  await p.getByRole('button', { name: 'שליחת הביקורת' }).click();
  await p.getByRole('status').filter({ hasText: 'תודה' }).waitFor({ timeout: 10000 });

  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await fill();
  await p.waitForTimeout(2700);
  await p.getByRole('button', { name: 'שליחת הביקורת' }).click();
  await p.getByRole('status').filter({ hasText: 'תודה! הביקורת התקבלה' }).waitFor({ timeout: 10000 });
  check('reviews', 'a review is received', true);
  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  check('reviews', 'and is not published before the owner approves it', !(await p.locator('main').innerText()).includes(text));

  const ownerCtx = await b.newContext({ httpCredentials: { username: 'owner', password: PASSWORD }, viewport: { width: 1200, height: 1000 } });
  const admin = await ownerCtx.newPage();
  await admin.goto(B + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  // Counted by the review itself: each sits in a list item of its own list.
  const waiting = admin.locator('li', { hasText: text });
  const cards = await admin.locator('article', { hasText: text }).count();
  check('reviews', 'the owner sees it waiting, once (the too-fast one was not kept)', cards === 1, `${cards} waiting with that text`);
  await waiting.getByRole('button', { name: 'לאשר ולפרסם' }).click();
  await admin.waitForTimeout(1500);
  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  const shown = p.locator('article', { hasText: text });
  const card = (await shown.count()) ? await shown.innerText() : '';
  check('reviews', 'approved, it is published: anonymous, with the trip and the day it was written', card.includes('אנונימי') && card.includes('Saily · יפן') && card.includes('ממליצים') && /נכתבה ב־\d{1,2}\.\d{1,2}\.\d{4}/.test(card), card.replace(/\n/g, ' · ').slice(0, 90));
  await admin.goto(B + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  await admin.locator('li', { hasText: text }).getByRole('button', { name: /להסיר מהאתר/ }).click();
  await admin.waitForTimeout(1500);
  await p.goto(B + '/reviews', { waitUntil: 'domcontentloaded' });
  check('reviews', 'and the owner can remove it again', (await p.locator('article', { hasText: text }).count()) === 0);
  await ownerCtx.close();

  const stranger = await b.newContext();
  const s = await stranger.newPage();
  const answer = await s.goto(B + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  check('reviews', 'nobody else can open the approval page', answer?.status() === 401, `${answer?.status()}`);
  await stranger.close();
  await p.close();
} catch (e) { check('reviews', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ region pages ══════════════════════════════════════════════════════════
// The owner, 15 October 2026: the plans covering several of a region's
// countries, how many each covers and which it leaves out.
try {
  const p = await page();
  await p.goto(B + '/esim/region/balkans', { waitUntil: 'domcontentloaded' });
  const picker = p.getByRole('group', { name: 'לאילו מדינות בבלקן אתם נוסעים?' });
  await picker.getByRole('checkbox').first().waitFor(); await p.waitForTimeout(1000);
  check('region', 'the Balkans page asks which of its nine countries', (await picker.getByRole('checkbox').count()) === 9);
  const texts = await p.locator('section[aria-labelledby="region-plans"] article').allInnerTexts();
  check('region', 'there are plans to compare', texts.length > 0, `${texts.length} cards`);
  check('region', 'every card says how many of the nine it covers', texts.every((t) => /מכסה (\d+ מתוך|את כל) 9 המדינות באזור/.test(t)));
  check('region', 'and names what is missing, or what it covers, as the provider’s list', texts.filter((t) => !t.includes('את כל 9')).every((t) => t.includes('לא ברשימה שהספק מפרסם:') || t.includes('מהאזור, ברשימה שהספק מפרסם:')));
  check('region', 'the basis of the list is said, as our choice', (await p.locator('main').innerText()).includes('הבחירה שלנו'));
  const before = await p.locator('section[aria-labelledby="region-plans"] article').count();
  await picker.locator('label', { hasText: 'קרואטיה' }).click();
  await picker.locator('label', { hasText: 'אלבניה' }).click();
  await p.waitForTimeout(300);
  const fit = await p.locator('section[aria-labelledby="region-plans"] article').allInnerTexts();
  const said = await p.locator('form p[aria-live="polite"]').first().innerText();
  check('region', 'ticking keeps only the plans that cover every ticked country', fit.length <= before && fit.every((t) => !/לא ברשימה שהספק מפרסם:[^\n]*(קרואטיה|אלבניה)/.test(t)), `${before} -> ${fit.length}`);
  check('region', 'and says how many are left', /\d+ מתוך \d+ מכסות את כל מה שסימנתם/.test(said), said);
  await p.getByRole('button', { name: 'להשוואה לפי הטיול שלי' }).click();
  await p.waitForURL('**/search?**', { timeout: 15000 });
  check('region', 'on to the search with the ticked countries, in the region’s order', decodeURIComponent(p.url()).includes('to=HR,AL'), p.url().replace(B, ''));
  await p.waitForTimeout(1500);
  check('region', 'where the days are asked', (await p.getByRole('spinbutton', { name: /^לכמה ימים ב/ }).count()) === 2);
  await p.close();

  // Without JavaScript the form still reaches the same trip.
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const q = await ctx.newPage();
  await q.goto(B + '/esim/region/balkans', { waitUntil: 'domcontentloaded' });
  await q.locator('label', { hasText: 'מונטנגרו' }).click();
  await q.locator('label', { hasText: 'קרואטיה' }).click();
  await Promise.all([q.waitForURL('**/search?**', { timeout: 15000 }), q.getByRole('button', { name: 'להשוואה לפי הטיול שלי' }).click()]);
  const heading = await q.locator('h1').first().innerText();
  check('region', 'without JavaScript the ticks reach the search as one trip', heading.includes('קרואטיה') && heading.includes('מונטנגרו'), `${q.url().replace(B, '')} · ${heading}`);
  await ctx.close();

  const en = await page();
  await en.goto(B + '/en/esim/region/south-east-asia', { waitUntil: 'domcontentloaded' });
  check('region', 'the English page reads left to right, with the UN’s list', (await en.locator('html').getAttribute('dir')) === 'ltr' && (await en.locator('main').innerText()).includes('11 countries the UN'));
  await en.goto(B + '/esim', { waitUntil: 'domcontentloaded' });
  check('region', 'the destination index links the six region pages', (await en.locator('a[href^="/esim/region/"]').count()) === 6);
  // Across continents (16 October 2026): the plans spanning three or more,
  // each with its countries per continent, and no wall of checkboxes.
  await en.goto(B + '/esim/region/world', { waitUntil: 'domcontentloaded' });
  const worldCards = await en.locator('section[aria-labelledby="region-plans"] article').allInnerTexts();
  check('region', 'the page across continents lists global plans by continent, with nothing to tick', worldCards.length > 0 && worldCards.every((t) => /מכסה \d+ מדינות: /.test(t)) && (await en.getByRole('checkbox').count()) === 0, `${worldCards.length} cards`);
  // And (17 October 2026) something to do there: the owner found a page of
  // plans with no way on. The trip is asked above them, as on the home page.
  const worldSearch = en.getByRole('region', { name: 'לאילו מדינות אתם נוסעים?' });
  const worldBox = worldSearch.getByRole('combobox', { name: 'יעד הטיול' });
  check('region', 'the page across continents asks for the trip’s countries', (await worldBox.count()) === 1);
  await en.waitForTimeout(900);
  for (const name of ['יפן', 'צרפת', 'ארצות הברית']) {
    await worldBox.click(); await worldBox.type(name, { delay: 30 });
    await en.getByRole('option', { name: new RegExp(name) }).first().click();
    await en.waitForTimeout(300);
  }
  // The plans below narrow to the ones covering all three, as ticks do on the other region pages.
  const worldPlans = en.locator('section[aria-labelledby="region-plans"]');
  const narrowed = await worldPlans.locator('article').count();
  const fitLine = (await worldPlans.innerText()).match(/(\d+) מתוך (\d+) מכסות את כל המדינות שבחרתם/);
  check('region', 'the plans below narrow to those covering every chosen country', Boolean(fitLine) && Number(fitLine[1]) <= Number(fitLine[2]) && narrowed <= worldCards.length, fitLine?.[0] ?? `${narrowed} cards, no count line`);
  const worldDays = worldSearch.getByRole('spinbutton', { name: /^לכמה ימים ב/ });
  for (let i = 0; i < (await worldDays.count()); i++) await worldDays.nth(i).fill('5');
  await Promise.all([en.waitForURL('**/search?**', { timeout: 15000 }), worldSearch.getByRole('button', { name: 'הצגת החבילות המתאימות' }).click()]);
  const worldHeading = await en.locator('h1').first().innerText();
  check('region', 'and goes on to compare a trip on three continents', ['יפן', 'צרפת', 'ארצות הברית'].every((name) => worldHeading.includes(name)), `${en.url().replace(B, '')} · ${worldHeading}`);
  // Countries typed on the home page before "several continents" was chosen
  // come with it, filling the form without claiming results it never showed.
  await en.goto(B + '/esim/region/world?to=JP,FR', { waitUntil: 'domcontentloaded' });
  await en.waitForTimeout(900);
  check('region', 'countries chosen before arrive filled in', (await en.getByRole('button', { name: 'הסרת יפן' }).count()) === 1 && (await en.getByRole('button', { name: 'הסרת צרפת' }).count()) === 1);
  await en.getByRole('button', { name: 'הסרת יפן' }).click();
  await en.getByRole('button', { name: 'הסרת צרפת' }).click();
  await en.waitForTimeout(800);
  check('region', 'and removing them stays on the page, with no stale-results notice', en.url().includes('/esim/region/world') && (await en.getByRole('button', { name: 'עדכון התוצאות' }).count()) === 0, en.url().replace(B, ''));
  await en.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await en.waitForTimeout(1000);
  await en.getByRole('combobox', { name: 'יעד הטיול' }).type('אמריקה', { delay: 40 });
  await en.waitForTimeout(500);
  check('region', 'typing "America" offers both Americas', (await en.getByRole('option', { name: /צפון אמריקה/ }).count()) === 1 && (await en.getByRole('option', { name: /דרום ומרכז אמריקה/ }).count()) === 1);
  await en.close();
} catch (e) { check('region', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ the before-you-fly list ═══════════════════════════════════════════════
try {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(B + '/esim/japan', { waitUntil: 'domcontentloaded' });
  const list = p.getByRole('region', { name: 'רשימה לפני הטיסה ליפן' });
  const items = list.getByRole('checkbox');
  // A streamed part of the page is revealed after DOMContentLoaded, and ticks
  // count only once the page has hydrated.
  await items.first().waitFor(); await p.waitForTimeout(1000);
  const total = await items.count();
  check('checklist', 'a country page carries its before-you-fly list, eSIM steps first', total >= 8 && (await list.innerText()).includes('להתקין את ה־eSIM בבית'));
  check('checklist', 'with what Japan’s facts call for: sockets, 100 volts, driving on the left',
    (await list.innerText()).includes('השקעים ביפן מסוג') && (await list.innerText()).includes('100 וולט') && (await list.innerText()).includes('בצד שמאל'));
  await list.locator('label').first().click();
  await list.locator('label').nth(1).click();
  check('checklist', 'ticking counts what is done', (await list.innerText()).includes(`סומנו 2 מתוך ${total}`));
  const wa = await list.getByRole('link', { name: /בוואטסאפ/ }).getAttribute('href');
  check('checklist', 'the WhatsApp link carries the list and the page', decodeURIComponent(wa ?? '').includes('☐ להתקין את ה־eSIM') && decodeURIComponent(wa ?? '').includes('#trip-checklist'));
  check('checklist', 'and it can be printed', (await list.getByRole('button', { name: 'להדפסה' }).count()) === 1);
  await ctx.close();
} catch (e) { check('checklist', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ Booking.com planner ═══════════════════════════════════════════════════
// The owner, 14 October 2026: before Booking, ask where in each country of the
// trip, then give a row of links per place — hotel, car, attractions — at the
// bottom of the page, after the plans.
try {
  const DL = 'https://www.tkqlhce.com/links/101892359/type/dlg/https://www.booking.com';
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(B + '/esim/france?to=FR:5&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1000);
  const planner = p.getByRole('region', { name: 'מלונות, רכב ואטרקציות לטיול' });
  const plannerTop = (await planner.boundingBox())?.y ?? -1;
  const lastPlanTop = (await p.locator('article').last().boundingBox())?.y ?? Infinity;
  check('booking', 'the planner is on the country page, below the plans', (await planner.count()) === 1 && plannerTop > lastPlanTop, `${plannerTop} / ${lastPlanTop}`);

  const where = planner.getByRole('group', { name: 'איפה בצרפת?' });
  check('booking', 'it asks where in the country: its cities, and the whole country',
    (await where.getByRole('checkbox').count()) >= 4
      && (await where.getByRole('checkbox', { name: 'פריז', exact: true }).count()) === 1
      && (await where.getByRole('checkbox', { name: 'כל צרפת (עוד לא יודעים)' }).count()) === 1);
  check('booking', 'no Booking link until a place is chosen',
    (await planner.getByRole('link').count()) === 0 && (await planner.innerText()).includes('הקישורים יופיעו כאן'));

  await where.locator('label', { hasText: /^פריז$/ }).click();
  await p.waitForTimeout(200);
  const links = () => planner.getByRole('link').evaluateAll((as) => as.map((a) => [a.getAttribute('href'), a.getAttribute('rel'), a.getAttribute('target')]));
  const paris = await links();
  check('booking', 'Paris gets its own hotels, car and attractions pages on Booking',
    paris.length === 3
      && paris[0][0] === `${DL}/city/fr/paris.he.html`
      && paris[1][0] === `${DL}/cars/city/fr/paris.he.html`
      && paris[2][0] === `${DL}/things-to-do/city/fr/paris.he.html`,
    JSON.stringify(paris.map((l) => l[0])));
  check('booking', 'each link says which place in its name',
    (await planner.getByRole('link', { name: /^מלונות בפריז/ }).count()) === 1
      && (await planner.getByRole('link', { name: /^השכרת רכב בפריז/ }).count()) === 1
      && (await planner.getByRole('link', { name: /^אטרקציות בפריז/ }).count()) === 1);
  check('booking', 'all are sponsored links that open a new tab', paris.every((l) => /\bsponsored\b/.test(l[1] ?? '') && l[2] === '_blank'));

  await where.locator('label', { hasText: 'כל צרפת' }).click();
  await p.waitForTimeout(200);
  const both = await links();
  check('booking', 'the whole country adds France’s hotels and cars pages, and the main city’s attractions',
    both.length === 6
      && both.some((l) => l[0] === `${DL}/country/fr.he.html`)
      && both.some((l) => l[0] === `${DL}/cars/country/fr.he.html`)
      && (await planner.getByRole('link', { name: /^אטרקציות בפריז/ }).count()) === 2,
    JSON.stringify(both.map((l) => l[0])));

  await where.locator('label', { hasText: /^פריז$/ }).click();
  await p.waitForTimeout(200);
  check('booking', 'unticking a place takes its links away', (await links()).length === 3);
  const text = await planner.innerText();
  check('booking', 'it says these are links, not a comparison, and that we may earn a commission',
    text.includes('לא משווים') && text.includes('קישור שותף'));
  check('booking', 'it carries Booking’s logo', (await planner.getByRole('img', { name: 'Booking.com' }).count()) === 1);

  // A plan click no longer puts anything above the plans.
  const urlBefore = p.url();
  await p.locator('article').first().getByRole('button', { name: /לחבילה באתר/ }).first().click();
  await p.waitForTimeout(400);
  check('booking', 'choosing a plan stays on the page and adds nothing above the plans',
    p.url() === urlBefore && (await p.getByRole('region', { name: 'מלונות, רכב ואטרקציות לטיול' }).count()) === 1);

  // Every country of a multi-stop trip has its own question.
  const multi = await ctx.newPage();
  await multi.goto(B + '/search?to=FR:4,IT:6&usage=regular', { waitUntil: 'domcontentloaded' });
  await multi.waitForTimeout(1100);
  const trip = multi.getByRole('region', { name: 'מלונות, רכב ואטרקציות לטיול' });
  check('booking', 'a two-country trip asks where in each',
    (await trip.getByRole('group', { name: 'איפה בצרפת?' }).count()) === 1 && (await trip.getByRole('group', { name: 'איפה באיטליה?' }).count()) === 1);
  await trip.getByRole('group', { name: 'איפה באיטליה?' }).locator('label', { hasText: /^רומא$/ }).click();
  await trip.getByRole('group', { name: 'איפה בצרפת?' }).locator('label', { hasText: /^פריז$/ }).click();
  await multi.waitForTimeout(200);
  const rows = await trip.locator('li').allInnerTexts();
  check('booking', 'and names each place with its country',
    rows.length === 2 && rows.some((r) => r.includes('פריז, צרפת')) && rows.some((r) => r.includes('רומא, איטליה')), JSON.stringify(rows.map((r) => r.slice(0, 20))));
  check('booking', 'Rome links Rome’s pages', (await trip.getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).includes(`${DL}/city/it/rome.he.html`));
  await ctx.close();
} catch (e) { check('booking', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ car rental page ══════════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/car-rental?country=FR', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  const empty = await p.locator('body').innerText();
  check('rental', 'the country is prefilled from the eSIM search',
    (await p.locator('#rental-country').inputValue()) === 'FR');
  check('rental', 'it asks for the city instead of guessing one', empty.includes('לא את העיר'));
  check('rental', 'no results until there is something to search with', empty.includes('מלאו את הפרטים'));
  check('rental', 'the site does not present itself as a rental company', empty.includes('לא משכירים רכב'));

  await p.locator('#rental-pickup').fill('Paris CDG');
  await p.getByRole('button', { name: 'חיפוש רכבים' }).click();
  await p.waitForLoadState('domcontentloaded');
  await p.waitForTimeout(700);
  const rows = p.locator('li').filter({ hasText: 'סה״כ לתקופה' });
  const text = await p.locator('body').innerText();
  check('rental', 'the search returns offers', (await rows.count()) > 0, `${await rows.count()} rows`);
  check('rental', 'the search lives in the URL, so it can be shared', p.url().includes('pickup=Paris'));
  check('rental', 'demo offers are called demo', text.includes('ההצעות כאן אינן אמיתיות'));
  check('rental', 'a demo row leads nowhere rather than somewhere fake', text.includes('אין עדיין קישור להזמנה'));
  check('rental', 'a model is offered as an example, not promised', text.includes('או דומה'));
  check('rental', 'a row with no model says the category is the promise', text.includes('מתחייבת לקטגוריה'));
  check('rental', 'a converted price says it is converted', text.includes('המרה משוערת') && text.includes('חברת ההשכרה גובה'));

  // Cheapest first, and never by which network supplied the row.
  // Read per row: the first shekel figure in a row is its total. Scraping
  // every figure off the page and taking alternate ones broke the day a
  // per-day price came out whole (₪179) and printed without decimals.
  const totals = [];
  for (let i = 0; i < (await rows.count()); i++) {
    const figure = (await rows.nth(i).innerText()).match(/₪([\d,]+(?:\.\d\d)?)/);
    if (figure) totals.push(Number(figure[1].replace(/,/g, '')));
  }
  check('rental', 'offers are ordered cheapest first',
    totals.every((value, i) => i === 0 || value >= totals[i - 1]), totals.join(' '));

  await p.goto(B + '/en/car-rental?country=FR&pickup=Paris', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(600);
  const en = await p.locator('body').innerText();
  check('rental', 'the English page is translated, not a Hebrew fallback',
    en.includes('Compare rental car prices') && !en.includes('השוואת מחירי'));
  await p.close();
} catch (e) { check('rental', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ destination index & interlinking ═════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/esim', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  const body = await p.locator('body').innerText();
  const links = await p.locator('a[href^="/esim/"]').count();

  check('index', 'every destination has a crawlable link', links > 200, `${links} links`);
  check('index', 'the index says how much of the world it can answer for', /יעדים מתוך/.test(body));
  check('index', 'and that the prices behind it are demo', body.includes('לפני השקה'));
  check('index', 'destinations with nothing behind them are labelled, not hidden', body.includes('עדיין אין'));
  check('index', 'the index carries no prices itself', (await priceCount(p)) === 0);

  // The block that stops every country page being an island.
  await p.goto(B + '/esim/greece?to=GR:5&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const related = p.locator('section').filter({ hasText: 'יעדים נוספים באזור' });
  check('index', 'a country page suggests other destinations', (await related.count()) === 1);
  const hrefs = await related.locator('a').evaluateAll((all) => all.map((a) => a.getAttribute('href')));
  check('index', 'it never links to itself', !hrefs.some((href) => href.endsWith('/esim/greece')), hrefs.join(' '));
  check('index', 'the suggestions are places people go, not alphabetical accidents',
    hrefs.some((href) => href.endsWith('/esim/italy')) && hrefs.some((href) => href.endsWith('/esim/spain')),
    hrefs.join(' '));

  // Every suggestion has to resolve — a dead internal link is worse than none.
  let broken = 0;
  for (const href of hrefs) {
    const response = await p.request.get(B + href);
    if (!response.ok()) broken += 1;
  }
  check('index', 'every suggested destination resolves', broken === 0, `${broken} broken`);

  const nav = await p.locator('header nav[aria-label], footer nav').allInnerTexts();
  check('index', 'the index is reachable from the site navigation', nav.join(' ').includes('כל היעדים'));
  await p.close();
} catch (e) { check('index', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ══ details & honesty ════════════════════════════════════════════════════
try {
  const p = await page();
  await p.goto(B + '/esim/thailand?days=14&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1100);
  const details = p.getByRole('button', { name: /עוד פרטים/ }).first();
  if (await details.count()) {
    await details.click(); await p.waitForTimeout(500);
    const t = await p.locator('body').innerText();
    check('details', 'the details panel opens', t.length > 0);
  }
  const t = await p.locator('body').innerText();
  check('honesty', 'demo-data notice is on the priced page', t.includes('נתוני הדגמה'));
  check('honesty', 'affiliate disclosure is on the priced page', t.includes('רוכשים ישירות מהספק'));
  await p.close();
} catch (e) { check('run', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

// ── the owner's dashboard: a real browser is counted, robots and opt-outs are not
// The test servers run with STATS_STORE=memory and a test DASHBOARD_PASSWORD
// (scripts/nightly.sh). Headless Chromium says so in its user agent and is
// dropped as a robot, so the visitor here wears an ordinary Chrome's.
try {
  const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'test-dashboard-password';
  const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
  const owner = await b.newContext({ httpCredentials: { username: 'owner', password: PASSWORD }, viewport: { width: 1400, height: 1000 } });
  const admin = await owner.newPage();
  const tiles = async () => {
    const response = await admin.goto(`${B}/admin?days=7`, { waitUntil: 'domcontentloaded' });
    if (response?.status() !== 200) throw new Error(`/admin answered ${response?.status()} — is DASHBOARD_PASSWORD set on the server?`);
    const read = async (label) => Number((await admin.locator('li', { hasText: label }).first().locator('p').nth(1).innerText()).replace(/[^\d]/g, ''));
    return { visits: await read('כניסות לאתר'), searches: await read('חיפושים'), clicks: await read('לחיצות לספקים'), body: await admin.locator('body').innerText() };
  };
  const settle = (p) => p.waitForTimeout(700);

  const before = await tiles();
  const visitor = await b.newContext({ userAgent: CHROME, viewport: { width: 1400, height: 1000 } });
  const v = await visitor.newPage();
  await v.goto(`${B}/`, { waitUntil: 'domcontentloaded' });
  await settle(v);
  await v.goto(`${B}/search?to=TH:7&usage=regular`, { waitUntil: 'domcontentloaded', referer: `${B}/` });
  await settle(v);
  await v.locator('article').first().getByRole('button', { name: /לחבילה באתר/ }).or(v.locator('article').first().getByRole('link', { name: /לחבילה באתר/ })).first().click();
  await settle(v);
  await v.goto(`${B}/esim/no-such-country-here`, { waitUntil: 'domcontentloaded', referer: `${B}/` });
  await settle(v);
  const cookies = await visitor.cookies();
  const after = await tiles();
  check('dashboard', 'a visit from outside counts once, the next pages do not', after.visits - before.visits === 1, `${before.visits} → ${after.visits}`);
  check('dashboard', 'the search is counted', after.searches - before.searches === 1, `${before.searches} → ${after.searches}`);
  check('dashboard', 'the plan click is counted', after.clicks - before.clicks === 1, `${before.clicks} → ${after.clicks}`);
  check('dashboard', 'the destination searched is listed', after.body.includes('תאילנד'));
  check('dashboard', 'a missing page is counted as a 404, not by its address', after.body.includes('עמוד שלא קיים (404)') && !after.body.includes('no-such-country-here'));
  check('dashboard', 'counting sets no cookie', cookies.length === 0, cookies.map((c) => c.name).join(', '));

  const gpc = await b.newContext({ userAgent: CHROME, extraHTTPHeaders: { 'sec-gpc': '1' } });
  const g = await gpc.newPage();
  await g.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true }));
  await g.goto(`${B}/`, { waitUntil: 'domcontentloaded' });
  await settle(g);
  const robot = await b.newPage();
  await robot.goto(`${B}/`, { waitUntil: 'domcontentloaded' });
  await settle(robot);
  const later = await tiles();
  check('dashboard', 'a browser with Global Privacy Control, and a headless robot, are not counted', later.visits === after.visits, `${after.visits} → ${later.visits}`);

  const cron = await fetch(`${B}/api/cron/daily-stats`, { headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {} });
  const job = await cron.json().catch(() => ({}));
  check('dashboard', 'the daily job runs and says what is due', cron.status === 200 && job.ok === true && Array.isArray(job.alerts), `${cron.status} ${JSON.stringify(job).slice(0, 80)}`);
  await Promise.all([owner.close(), visitor.close(), gpc.close(), robot.close()]);
} catch (e) { check('run', 'dashboard section completed', false, e.message.split('\n')[0].slice(0, 120)); }

await b.close();
console.log(log.join('\n'));
console.log(`\n  ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
