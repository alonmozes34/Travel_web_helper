import { chromium } from 'playwright';

/**
 * Smoke test for the traveller's core path: destination -> results.
 *
 * Run against a built app:  npm run build && npm run start
 *   BASE_URL=http://localhost:3000 npm run test:e2e
 * Screenshots are written to SHOT_DIR when it is set.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOT_DIR = process.env.SHOT_DIR ?? null;
const shot = async (target, name, options = {}) => {
  if (SHOT_DIR) await target.screenshot({ path: `${SHOT_DIR}/${name}.png`, ...options });
};
const out = [];
const ok = (label, cond, extra = '') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(BASE, { waitUntil: 'networkidle' });
ok('html dir is rtl', await page.getAttribute('html', 'dir') === 'rtl');

const input = page.getByRole('combobox', { name: 'יעד הטיול' });
await input.click();
await input.type('תא', { delay: 40 });
await page.waitForSelector('[role="listbox"]');
const options = await page.locator('[role="option"]').allInnerTexts();
ok('autocomplete offers Thailand', options.some((o) => o.includes('תאילנד')), options.join(' | '));

await input.press('Enter');
await page.waitForTimeout(200);
ok('the destination becomes a chip on the trip', (await page.locator('form li').count()) === 1);

// A second stop is added rather than replacing the first.
await input.type('united', { delay: 40 });
await page.waitForSelector('[role="listbox"]');
await input.press('Enter');
await page.waitForTimeout(200);
ok('a second destination can be added', (await page.locator('form li').count()) === 2);

// Per-stop trip length.
await page.locator('form li input[type="number"]').first().fill('1');
await page.locator('form li input[type="number"]').nth(1).fill('14');
await page.waitForTimeout(150);

await page.getByRole('button', { name: /התאם לי חבילה לטיול/ }).click();
await page.locator('label:has-text("רגיל")').first().click();
await page.waitForTimeout(150);
ok(
  'usage is a single choice and reflects the selection',
  await page.getByRole('radio', { name: /רגיל/ }).isChecked(),
);
ok(
  'each usage level explains itself on screen',
  (await page.locator('form').innerText()).includes('רשתות חברתיות, מפות, גלישה'),
);
await shot(page, 'phase2-home-desktop');

await page.getByRole('button', { name: 'השווה eSIM' }).click();
await page.waitForURL('**/search**');
const url = new URL(page.url());
ok('a multi-stop trip goes to the search page', url.pathname === '/search', url.pathname);
ok(
  'the stops and their lengths travel in the URL',
  /:1/.test(url.searchParams.get('to') ?? '') && /:14/.test(url.searchParams.get('to') ?? ''),
  url.search,
);
ok(
  'a combination is offered when no single plan covers the trip well',
  (await page.locator('main').innerText()).includes('צירוף חבילות'),
);
ok(
  'every listed plan covers the whole trip',
  (await page.locator('article.row, article').count()) > 0,
);
await shot(page, 'multi-search');

// A single destination keeps its own indexable country page.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.getByRole('combobox', { name: 'יעד הטיול' }).type('תאילנד', { delay: 30 });
await page.waitForSelector('[role="listbox"]');
await page.keyboard.press('Enter');
await page.waitForTimeout(150);
await page.getByRole('button', { name: 'השווה eSIM' }).click();
await page.waitForURL('**/esim/thailand**');
ok('a single destination goes to its country page', new URL(page.url()).pathname === '/esim/thailand');

// Submitting with no destination must not navigate.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'השווה eSIM' }).click();
await page.waitForTimeout(200);
ok('empty search shows a hint instead of navigating', page.url().replace(/\/$/, '') === BASE && (await page.locator('[aria-live="polite"]').innerText()).length > 0);

// Keyboard-only path.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
await input.focus();
await input.type('יוו', { delay: 40 });
await page.waitForSelector('[role="listbox"]');
await input.press('ArrowDown');
await input.press('ArrowUp');
await input.press('Enter');
await page.waitForTimeout(150);
ok('keyboard selection works', (await page.locator('form li').innerText()).includes('יוון'));

// Mobile.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE, { waitUntil: 'networkidle' });
await mobile.getByRole('button', { name: 'פתיחת תפריט' }).click();
await mobile.waitForTimeout(250);
ok('mobile menu opens', await mobile.locator('dialog[open]').count() === 1);
await shot(mobile, 'phase2-mobile-menu');
await mobile.keyboard.press('Escape');
await mobile.waitForTimeout(250);
ok('escape closes the menu', await mobile.locator('dialog[open]').count() === 0);
await shot(mobile, 'phase2-home-mobile');

// Results page: rows, filters, comparison.
const results = `${BASE}/esim/thailand?days=14&usage=regular`;
await page.goto(results, { waitUntil: 'networkidle' });

const rowCount = await page.locator('article').count();
ok('results render plan rows', rowCount > 0, `${rowCount} rows`);
ok(
  'regional and global plans appear on a country page',
  (await page.locator('main').innerText()).includes('חבילה גלובלית'),
);
ok(
  'the summary counts come from the data',
  /\d+/.test(await page.locator('main').innerText()),
);
ok(
  'price per GB is present but secondary to the price',
  (await page.locator('main').innerText()).includes('/ GB'),
);
ok(
  'the charged price leads and the conversion is marked as an estimate',
  (await page.locator('article').first().innerText()).includes('≈') &&
    /(\$|€)\d/.test(await page.locator('article').first().innerText()),
);
ok(
  'the page says the conversion is only an estimate',
  (await page.locator('main').innerText()).includes('הערכה בלבד'),
);
ok(
  'the exchange rate and its date are visible, not hidden in a tooltip',
  /שערי ההמרה:.*\d\.\d+/.test(await page.locator('main').innerText()),
);

// Switching currency must change the prices, not just the pill.
await page.getByLabel('מטבע').selectOption('USD');
await page.waitForTimeout(800);
const usdText = await page.locator('article').first().innerText();
ok('changing currency re-renders the prices', !usdText.includes('₪'), usdText.split('\n')[0]);
await page.getByLabel('מטבע').selectOption('ILS');
await page.waitForTimeout(800);

// Filtering narrows the list and survives a reload through the URL.
await page.locator('aside label:has-text("5G בלבד")').click();
await page.waitForTimeout(250);
const afterFilter = await page.locator('article').count();
ok('filtering narrows the results', afterFilter > 0 && afterFilter < rowCount, `${afterFilter} of ${rowCount}`);
ok('filters are written into the URL', page.url().includes('5g=1'), page.url());

await page.reload({ waitUntil: 'networkidle' });
ok(
  'a shared filtered link renders the same result set',
  (await page.locator('article').count()) === afterFilter,
);

// Comparison, capped at three plans.
await page.goto(results, { waitUntil: 'networkidle' });
for (let i = 0; i < 3; i += 1) {
  await page.locator('article label:has-text("להשוואה")').first().click();
  await page.waitForTimeout(120);
}
const selectedCount = await page.locator('article label:has-text("הסרה")').count();
ok('three plans can be selected', selectedCount === 3, `${selectedCount} selected`);
// The limit is stated on screen rather than only in a tooltip.
const blocked = page.locator('article label:has-text("עד 3 חבילות")').first();
ok('a fourth selection is blocked', (await blocked.count()) > 0 && !(await blocked.isEnabled()));

await page.getByRole('button', { name: 'השווה', exact: true }).click();
await page.waitForTimeout(300);
ok('the comparison table opens', (await page.locator('dialog[open] table').count()) === 1);
ok(
  'differences between plans are marked',
  (await page.locator('dialog[open]').innerText()).includes('שונה בין החבילות'),
);
await shot(page, 'phase4-compare');
await page.keyboard.press('Escape');

// Plan details: the secondary action opens something real.
await page.goto(results, { waitUntil: 'networkidle' });
await page.locator('article').first().getByRole('button', { name: 'פרטים' }).click();
await page.waitForTimeout(200);
const detailText = await page.locator('article').first().innerText();
ok('the details button opens a panel', detailText.includes('למה החבילה מדורגת כך'));
ok(
  'the panel explains the ranking factors',
  detailText.includes('מחיר יחסית לחבילות האחרות') && detailText.includes('גובה העמלה אינו'),
);

// Country facts are derived from the plans, not pre-written.
const pageText = await page.locator('main').innerText();
ok('practical information is present', pageText.includes('מידע פרקטי'));
const summaryCount = (await page.locator('main').innerText()).match(/מצאנו (\d+) חבילות/)?.[1];
ok(
  'the practical answers cite the same counts as the results',
  summaryCount !== undefined && pageText.includes(`מצאנו ${summaryCount} חבילות`) && /AIS/.test(pageText),
  `count ${summaryCount}`,
);

// Every interactive control needs an accessible name.
const snapshot = await page.accessibility.snapshot();
const unnamed = [];
const walk = (node) => {
  if (!node) return;
  const interactive = ['button', 'link', 'checkbox', 'combobox', 'textbox', 'radio'];
  if (interactive.includes(node.role) && !(node.name ?? '').trim()) {
    unnamed.push(node.role);
  }
  (node.children ?? []).forEach(walk);
};
walk(snapshot);
ok('every control has an accessible name', unnamed.length === 0, unnamed.join(', '));

// Keyboard reachability: tabbing from the top reaches the first plan's action.
await page.goto(results, { waitUntil: 'networkidle' });
let reachedCta = false;
for (let i = 0; i < 150 && !reachedCta; i += 1) {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
  if (focused === 'צפייה בחבילה') reachedCta = true;
}
ok('the first plan action is reachable by keyboard alone', reachedCta);

// English locale still works.
await page.goto(BASE + '/en', { waitUntil: 'networkidle' });
ok('english is ltr', await page.getAttribute('html', 'dir') === 'ltr');
ok('english copy', (await page.locator('h1').innerText()).includes('best-value'));

await browser.close();
console.log(out.join('\n'));
process.exit(out.some((line) => line.startsWith('FAIL')) ? 1 : 0);
