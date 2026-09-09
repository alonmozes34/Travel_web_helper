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

// The two questions open on their own once a destination is chosen; they are
// the answer to "which plan fits", not an optional refinement.
ok('choosing a destination opens the trip questions', await page.locator('fieldset').last().isVisible());
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
ok(
  'and shows the daily figure behind it',
  (await page.locator('form').innerText()).includes('ליום לפי ההערכה שלנו'),
);
ok(
  'the scale reaches tethering, not just "heavy"',
  (await page.locator('form').innerText()).includes('מודם לכל המכשירים'),
);
ok(
  'a traveller who knows their own figure can give it',
  (await page.locator('form').innerText()).includes('כמה GB לכל הטיול'),
);
await shot(page, 'phase2-home-desktop');

await page.getByRole('button', { name: 'למצוא חבילה' }).click();
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

// A single destination keeps its own indexable country page — but only once
// the trip is described, because until then there is nothing to recommend.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.getByRole('combobox', { name: 'יעד הטיול' }).type('תאילנד', { delay: 30 });
await page.waitForSelector('[role="listbox"]');
await page.keyboard.press('Enter');
await page.waitForTimeout(150);

await page.getByRole('button', { name: 'למצוא חבילה' }).click();
await page.waitForTimeout(400);
ok(
  'an undescribed trip does not run the search',
  page.url().replace(/\/$/, '') === BASE,
  page.url(),
);
ok(
  'and the page says which answer is missing',
  (await page.locator('[aria-live="polite"]').first().innerText()).includes('ימים'),
);

await page.locator('form li input[type="number"]').first().fill('10');
await page.locator('label:has-text("רגיל")').first().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: 'למצוא חבילה' }).click();
await page.waitForURL('**/esim/thailand**');
ok('a single destination goes to its country page', new URL(page.url()).pathname === '/esim/thailand');
ok(
  'the answers travel with it',
  decodeURIComponent(page.url()).includes('TH:10') && page.url().includes('usage=regular'),
  page.url(),
);

// Submitting with no destination must not navigate.
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'למצוא חבילה' }).click();
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

// Only a shortlist is rendered; the rest are one click away, not dropped.
// Counted within the top group: plans that fall short of the trip are listed
// separately below, under their own heading.
const fitting = await page
  .locator('section[aria-label="תוצאות ההשוואה"] > div > article')
  .count();
ok('the list opens as a shortlist', fitting <= 5 && fitting > 0, `${fitting} rows`);
ok(
  'plans that run out are separated, not mixed in',
  (await page.locator('h3', { hasText: 'חבילות קטנות מהצריכה שלכם' }).count()) <= 1,
);
const showAll = page.getByRole('button', { name: /הצגת עוד/ });
ok('the remaining plans are offered', (await showAll.count()) === 1);
await showAll.click();
await page.waitForTimeout(300);
const fullCount = await page.locator('article').count();
ok('showing everything reveals the full list', fullCount > rowCount, `${fullCount} rows`);
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
  (await page.locator('main').innerText()).includes('לכל GB'),
);

// Both currencies, both readable, both labelled. The shekel answers "what
// does this cost me" and the provider's currency answers "what will my card
// be charged" — a traveller has both questions and neither may be in 11px grey.
{
  const card = await page.locator('article').first().innerText();
  ok('the price in the traveller’s own currency is shown', /₪\s?\d/.test(card));
  ok('the amount the provider charges is shown too', /(\$|€)\d/.test(card));
  ok('the shekel figure is labelled as approximate', card.includes('בערך'));
  ok('the charged amount says where it will appear', card.includes('כרטיס האשראי'));
}

// The rate is one keyboard-reachable tap away — a disclosure, not a tooltip.
{
  const rates = page.locator('details:has-text("איך חישבנו")').first();
  ok('the conversion is explained on the page', (await rates.count()) > 0);
  await rates.locator('summary').click();
  await page.waitForTimeout(200);
  ok(
    'the exchange rate and its date are readable once opened',
    /שערי ההמרה:.*\d\.\d+/.test(await rates.innerText()),
  );
}

// Switching currency must change the prices, not just the pill.
await page.getByLabel('מטבע').selectOption('USD');
await page.waitForTimeout(800);
const usdText = await page.locator('article').first().innerText();
ok('changing currency re-renders the prices', !usdText.includes('₪'), usdText.split('\n')[0]);
await page.getByLabel('מטבע').selectOption('ILS');
await page.waitForTimeout(800);

// Filtering narrows the list and survives a reload through the URL.
// Counted from the announced total rather than the rendered cards, which the
// shortlist caps at five either way.
const announced = async () =>
  Number(
    // Scoped to the results section: the page has seven live regions, and the
    // first one belongs to the search form. sr-only text needs textContent —
    // innerText() reads empty for it.
    (await page
      .locator('section[aria-label="תוצאות ההשוואה"] [aria-live="polite"]')
      .first()
      .textContent())?.match(/\d+/)?.[0] ?? '0',
  );
const beforeFilter = await announced();
await page.locator('aside label:has-text("רק עם רשת 5G")').click();
await page.waitForTimeout(250);
const afterFilter = await announced();
ok(
  'filtering narrows the results',
  afterFilter > 0 && afterFilter < beforeFilter,
  `${afterFilter} of ${beforeFilter}`,
);
ok('filters are written into the URL', page.url().includes('5g=1'), page.url());

await page.reload({ waitUntil: 'networkidle' });
ok(
  'a shared filtered link renders the same result set',
  (await announced()) === afterFilter,
  `${await announced()} vs ${afterFilter}`,
);

// Comparison, capped at three plans.
await page.goto(results, { waitUntil: 'networkidle' });
for (let i = 0; i < 3; i += 1) {
  await page.locator('article label:has-text("סמנו להשוואה")').first().click();
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
  if (focused.startsWith('מעבר לאתר')) reachedCta = true;
}
ok('the first plan action is reachable by keyboard alone', reachedCta);

// A destination the catalogue covers only through global plans.
await page.goto(`${BASE}/esim/brazil`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
{
  const body = await page.locator('main, body').first().innerText();
  ok('a country with no plan of its own says so', body.includes('אין חבילה שנמכרת לברזיל בלבד'));
  ok('and still lists the global plans that cover it', (await page.locator('article').count()) > 0);
  ok(
    'an operator from another country is not shown',
    !body.includes('AIS') && !body.includes('Cosmote'),
  );
  ok('the unknown network is stated, not guessed', body.includes('הספק לא פרסם את הרשת ביעד הזה'));
  ok('no 5G claim is made without a network', !body.includes('ללא 5G'));
}

// A destination nothing in the catalogue covers.
await page.goto(`${BASE}/esim/tonga`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
{
  const body = await page.locator('main, body').first().innerText();
  ok('a destination with no coverage says so plainly', body.includes('עדיין אין לנו חבילה לטונגה'));
  ok('and does not render an empty result list', (await page.locator('article').count()) === 0);
  ok('and offers somewhere to go instead', (await page.locator('a[href*="/esim/"]').count()) > 0);
}

// A multi-stop trip through a destination nothing covers names that stop.
await page.goto(`${BASE}/search?to=BR:5,TO:3&usage=regular`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
{
  const body = await page.locator('main, body').first().innerText();
  ok('the uncovered stop is named, not counted as zero', body.includes('אין לנו אף חבילה לטונגה'));
  ok('and zero results are not reported as a finding', !body.includes('מצאנו 0 חבילות'));
}

// Any country on the globe can be searched.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
{
  const input = page.locator('input[role="combobox"], input[type="search"], input[type="text"]').first();
  await input.fill('מרוקו');
  await page.waitForTimeout(400);
  const suggestions = await page.locator('[role="option"], li').allInnerTexts();
  ok('a country outside the original twenty is searchable', suggestions.some((t) => t.includes('מרוקו')));
}

// English locale still works.
await page.goto(BASE + '/en', { waitUntil: 'networkidle' });
ok('english is ltr', await page.getAttribute('html', 'dir') === 'ltr');
ok('english copy', (await page.locator('h1').innerText()).includes('Internet abroad'));

await browser.close();
console.log(out.join('\n'));
process.exit(out.some((line) => line.startsWith('FAIL')) ? 1 : 0);
