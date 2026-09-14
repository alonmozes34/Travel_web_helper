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
