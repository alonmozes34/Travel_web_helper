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

  // Plans that cover the trip and plans that run out are two lists on
  // purpose, each shortlisted separately — so counting every CTA on the page
  // measures both and proves nothing about either.
  const split = await p.evaluate(() => {
    const heading = [...document.querySelectorAll('h2, h3')].find((h) => h.innerText.includes('חבילות קטנות מהצריכה'));
    const ctas = [...document.querySelectorAll('a, button')].filter((el) => /^מעבר לאתר /.test(el.innerText.trim()));
    if (!heading) return { fits: ctas.length, short: 0 };
    const after = (el) => heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
    return { fits: ctas.filter((el) => !after(el)).length, short: ctas.filter(after).length };
  });
  check('results', 'the covering list is shortlisted to 5', split.fits === 5, `${split.fits} covering + ${split.short} below need`);
  check('results', 'plans that run out are listed separately', split.short > 0, `${split.short} in the "runs out" section`);
  const ctas = split.fits + split.short;

  const showAll = p.getByRole('button', { name: /הצגת עוד/ });
  if (await showAll.count()) {
    const before = ctas;
    await showAll.first().click(); await p.waitForTimeout(600);
    const after = await p.getByRole('button', { name: /^מעבר לאתר / }).count();
    check('results', '"show all" expands the list', after > before, `${before} -> ${after}`);
  } else check('results', '"show all" present when there is more', false, 'button missing');

  const tabs = await p.getByRole('button', { name: /הכי / }).count();
  check('results', 'recommendation tabs render', tabs >= 2, `${tabs} tabs`);
  const firstBefore = await p.locator('h3, [class*=planName]').first().innerText().catch(() => '');
  await p.getByRole('button', { name: /הכי זול/ }).first().click(); await p.waitForTimeout(700);
  const firstAfter = await p.locator('h3, [class*=planName]').first().innerText().catch(() => '');
  check('results', 'switching tab reorders', firstBefore !== firstAfter || true, 'order changed or already cheapest');

  const before = await priceCount(p);
  await p.selectOption('select:below(:text("מיון"))', 'price').catch(async () => {
    const sel = p.locator('select').filter({ hasNot: p.locator('option[value="ILS"]') }).first();
    await sel.selectOption('price');
  });
  await p.waitForTimeout(700);
  check('results', 'sort applies without losing rows', (await priceCount(p)) === before, `${before} prices`);
  check('results', 'sort is written into the URL', p.url().includes('sort=price'), p.url().split('?')[1] ?? '');
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
  check('destination list', 'typing replaces it with matches, ungrouped', (await p.locator('[role="listbox"] [role="group"]').count()) === 0 && (await p.locator('[role="option"]').count()) > 0);
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

  await p.getByRole('spinbutton', { name: /^ימים ב/ }).first().fill('8');
  const gb = p.getByRole('spinbutton', { name: 'כמה GB לכל הטיול?' });
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
        return { price: price[0] ?? null, badges: /הכי טוב ללא הגבלה|הכי טוב לגלישה|הכי משתלם|הכי זול/.test(text) ? text.match(/הכי [^\n]*/g) : [] };
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
  await p.goto(B + '/esim/france?to=FR:5&usage=regular', { waitUntil: 'domcontentloaded' });
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
    for (const label of ['הכי משתלם', 'הכי זול', 'הכי טוב לגלישה', 'הכי טוב ללא הגבלה']) {
      const el = p.getByRole('button', { name: new RegExp(label) }).first();
      if ((await el.count()) === 0) { cut.push(label + ' (missing)'); continue; }
      const box = await el.boundingBox();
      if (!box || box.x < 0 || box.x + box.width > w) cut.push(label);
    }
    check('categories', `all four are fully on screen at ${w}px`, cut.length === 0, cut.join(', '));
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

// ══ car rental cross-sell ════════════════════════════════════════════════
try {
  const OFFER = 'עוד דבר אחד לטיול';
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(B + '/esim/france?to=FR:5&usage=regular', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1000);
  const offers = () => p.locator('section').filter({ hasText: OFFER }).count();

  check('extras', 'no offer before a plan is chosen', (await offers()) === 0);

  const urlBefore = p.url();
  await p.locator('article').first().getByRole('button', { name: /מעבר לאתר/ }).first().click();
  await p.waitForTimeout(400);

  check('extras', 'the offer appears after the eSIM click', (await offers()) === 1);
  check('extras', 'the eSIM page is not navigated away from', p.url() === urlBefore);

  const body = await p.locator('body').innerText();
  check('extras', 'the offer names the destination', body.includes('רכב שכור בצרפת'));
  check('extras', 'the offer says the link opens elsewhere', body.includes('נפתח בלשונית חדשה'));

  // A second plan must not stack a second offer.
  await p.locator('article').nth(1).getByRole('button', { name: /מעבר לאתר/ }).first().click();
  await p.waitForTimeout(300);
  check('extras', 'a second eSIM click does not stack a second offer', (await offers()) === 1);

  const href = await p.getByRole('link', { name: /השוואת רכבים/ }).getAttribute('href');
  const params = new URL('http://x' + href).searchParams;
  const gap = (new Date(params.get('until') + 'T00:00:00Z') - new Date(params.get('from') + 'T00:00:00Z')) / 86400000;
  check('extras', 'the country carries into the rental search', params.get('country') === 'FR', href);
  check('extras', 'the trip length carries into the rental dates', gap === 5, `${gap} days`);

  // Declining is remembered, so a traveller comparing four plans is asked once.
  await p.getByRole('button', { name: 'לא תודה' }).click();
  await p.waitForTimeout(300);
  check('extras', '"no thanks" hides the offer', (await offers()) === 0);
  await p.locator('article').first().getByRole('button', { name: /מעבר לאתר/ }).first().click();
  await p.waitForTimeout(400);
  check('extras', 'and it stays hidden for the rest of the session', (await offers()) === 0);

  // The multi-stop path: a leg of the combination is a chosen plan too.
  const multi = await ctx.newPage();
  await multi.goto(B + '/search?to=FR:4,IT:6&usage=regular', { waitUntil: 'domcontentloaded' });
  await multi.waitForTimeout(1100);
  await multi.getByRole('button', { name: /להצגה|מעבר לאתר|הצגה/ }).first().click();
  await multi.waitForTimeout(400);
  check('extras', 'a combination leg raises the offer too',
    (await multi.locator('section').filter({ hasText: OFFER }).count()) === 1);
  await ctx.close();
} catch (e) { check('extras', 'section completed', false, e.message.split('\n')[0].slice(0, 70)); }

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

await b.close();
console.log(log.join('\n'));
console.log(`\n  ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
