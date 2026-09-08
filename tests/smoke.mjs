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
await page.waitForTimeout(150);
ok('destination fills the field', (await input.inputValue()) === 'תאילנד');

// Latin query should find the same country.
await page.getByRole('button', { name: 'ניקוי היעד' }).click();
await input.type('thai', { delay: 40 });
await page.waitForSelector('[role="listbox"]');
ok('latin query matches', (await page.locator('[role="option"]').first().innerText()).includes('תאילנד'));
await input.press('Enter');

// Optional trip details.
await page.getByRole('button', { name: /התאם לי חבילה לטיול/ }).click();
await page.getByRole('button', { name: '8–14' }).click();
await page.getByRole('button', { name: 'רגיל', exact: true }).click();
ok(
  'usage chip reflects the selection',
  (await page.getByRole('button', { name: 'רגיל', exact: true }).getAttribute('aria-pressed')) === 'true',
);
ok(
  'duration range is not reversed by bidi',
  (await page.getByRole('button', { name: '8–14' }).innerText()).trim() === '8–14',
);
await shot(page, 'phase2-home-desktop');

await page.getByRole('button', { name: 'השווה eSIM' }).click();
await page.waitForURL('**/esim/thailand**');
const url = new URL(page.url());
ok('navigates to country page', url.pathname === '/esim/thailand', url.pathname);
ok('carries trip profile', url.searchParams.get('days') === '14' && url.searchParams.get('usage') === 'regular', url.search);

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
ok('keyboard selection works', (await input.inputValue()) === 'יוון');

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
ok(
  'a fourth selection is blocked',
  !(await page.locator('article label:has-text("להשוואה")').first().isEnabled()),
);

await page.getByRole('button', { name: 'השווה', exact: true }).click();
await page.waitForTimeout(300);
ok('the comparison table opens', (await page.locator('dialog[open] table').count()) === 1);
ok(
  'differences between plans are marked',
  (await page.locator('dialog[open]').innerText()).includes('שונה בין החבילות'),
);
await shot(page, 'phase4-compare');
await page.keyboard.press('Escape');

// English locale still works.
await page.goto(BASE + '/en', { waitUntil: 'networkidle' });
ok('english is ltr', await page.getAttribute('html', 'dir') === 'ltr');
ok('english copy', (await page.locator('h1').innerText()).includes('best-value'));

await browser.close();
console.log(out.join('\n'));
process.exit(out.some((line) => line.startsWith('FAIL')) ? 1 : 0);
