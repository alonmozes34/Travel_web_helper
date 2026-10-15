/**
 * Accessibility audit with axe-core against the running app.
 *
 * Israeli sites are bound by IS 5568, which adopts WCAG 2.0 AA; this runs the
 * WCAG 2.0/2.1/2.2 A and AA rule sets. Automated rules catch a minority of real
 * barriers, so this is a floor, not a certificate — the keyboard and zoom
 * checks below cover things axe cannot see.
 *
 *   npm run build && npm run start &
 *   BASE_URL=http://localhost:3000 node tests/a11y.mjs
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const axeSource = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

const PAGES = [
  ['homepage', '/'],
  ['country page', '/esim/thailand?days=14&usage=regular'],
  ['country page, the data calculator open', '/esim/japan'],
  ['country page, the data calculator open, english', '/en/esim/japan'],
  ['country page, answered by the calculator', '/esim/thailand?to=TH:14&act=social,video&usage=unlimited'],
  ['multi-stop search', '/search?to=DE:1,US:14&usage=regular'],
  ['empty search', '/search'],
  ['accessibility statement', '/accessibility'],
  ['contact form', '/contact'],
  ['contact form, english', '/en/contact'],
  ['affiliate disclosure', '/disclosure'],
  ['about', '/about'],
  ['about (English)', '/en/about'],
  ['guides', '/guides'],
  ['guide: how much data', '/guides/how-much-data'],
  ['guide: install (English)', '/en/guides/install'],
  ['privacy notice', '/privacy'],
  ['privacy notice, english', '/en/privacy'],
  ['terms of use', '/terms'],
  ['destination index', '/esim'],
  ['destination index, english', '/en/esim'],
  ['device compatibility', '/devices'],
  ['device compatibility, a model asked from the home page', '/devices?q=iPhone%2013'],
  ['discount codes', '/codes'],
  ['region page: the Balkans', '/esim/region/balkans'],
  ['reviews', '/reviews'],
  ['reviews, english', '/en/reviews'],
  ['region page: Europe', '/esim/region/europe'],
  ['region page, english: South-East Asia', '/en/esim/region/south-east-asia'],
  ['discount codes, english', '/en/codes'],
  ['car rental, before a search', '/car-rental?country=FR'],
  ['car rental, with results', '/car-rental?country=FR&pickup=Paris%20CDG'],
  ['car rental, english', '/en/car-rental?country=FR&pickup=Paris%20CDG'],
  ['device compatibility, english', '/en/devices'],
  ['english homepage', '/en'],
  ['preview unlock', '/unlock'],
  ['preview unlock, after a wrong password', '/unlock?next=%2Fesim%2Fthailand&error=1'],
];

const browser = await chromium.launch();
const findings = [];

async function audit(page, label) {
  await page.evaluate(axeSource);
  const result = await page.evaluate(async () =>
    await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    }),
  );
  for (const violation of result.violations) {
    findings.push({
      label,
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      example: violation.nodes[0]?.target?.join(' ') ?? '',
    });
  }
  return result;
}

for (const [label, path] of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const result = await audit(page, label);
  console.log(`${label}: ${result.violations.length} violation types, ${result.passes.length} rules passing`);
  await page.close();
}

// Interactive states axe never sees on a static load.
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${BASE}/esim/thailand`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.getByRole('button', { name: 'פתיחת תפריט' }).click();
await page.waitForTimeout(300);
const menu = await audit(page, 'mobile menu open');
console.log(`mobile menu open: ${menu.violations.length} violation types`);

await page.keyboard.press('Escape');

// The Booking.com planner with places chosen: its questions, and the rows of
// links that exist only after a tick — invisible to a static load of the URL.
// Nothing outside the site is loaded: the audit is of this page.
const extras = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await extras.context().route((url) => !url.href.startsWith(BASE), (route) => route.abort());
await extras.goto(`${BASE}/esim/france?to=FR:5&usage=regular`, { waitUntil: 'domcontentloaded' });
await extras.waitForTimeout(900);
const where = extras.getByRole('region', { name: 'מלונות, רכב ואטרקציות לטיול' }).getByRole('group', { name: 'איפה בצרפת?' });
await where.locator('label', { hasText: /^פריז$/ }).click();
await where.locator('label', { hasText: 'כל צרפת' }).click();
await extras.waitForTimeout(300);
const crossSell = await audit(extras, 'Booking planner, places chosen');
console.log(`Booking planner, places chosen: ${crossSell.violations.length} violation types`);
await extras.close();

// The model list after typing: a filtered list, and then the no-match block
// that replaces it — the state a reader reaches by typing a brand we do not
// list, which must not read as a verdict.
const devices = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await devices.goto(`${BASE}/devices`, { waitUntil: 'domcontentloaded' });
await devices.waitForTimeout(600);
await devices.getByLabel('חיפוש דגם').fill('אייפון 13');
await devices.waitForTimeout(300);
const filtered = await audit(devices, 'device list, filtered');
console.log(`device list, filtered: ${filtered.violations.length} violation types`);
await devices.getByLabel('חיפוש דגם').fill('Xiaomi 14');
await devices.waitForTimeout(300);
const empty = await audit(devices, 'device list, no match');
console.log(`device list, no match: ${empty.violations.length} violation types`);
await devices.close();

// The destination list as it opens before anything is typed: recent searches
// and popular destinations, which is `listbox > group > option` rather than
// the flat list the typed suggestions use.
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
await page.getByRole('combobox', { name: 'יעד הטיול' }).click();
await page.waitForTimeout(400);
const suggestions = await audit(page, 'destination list open, nothing typed');
console.log(`destination list open, nothing typed: ${suggestions.violations.length} violation types, ${suggestions.passes.length} rules passing`);

await page.setViewportSize({ width: 1400, height: 1000 });
await page.goto(`${BASE}/esim/thailand`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);
// The compare checkbox lives under each card's "more details".
for (let i = 0; i < 4; i += 1) await page.locator('article').nth(i).getByRole('button', { name: 'עוד פרטים' }).click();
for (let i = 0; i < 3; i += 1) {
  await page.locator('article label:has-text("להשוואה")').first().click();
  await page.waitForTimeout(120);
}
await page.getByRole('button', { name: 'השווה', exact: true }).click();
await page.waitForTimeout(400);
const dialog = await audit(page, 'comparison dialog open');
console.log(`comparison dialog open: ${dialog.violations.length} violation types`);
await page.close();

// The owner's dashboard (13 October 2026), behind its own password. A few
// counts are sent first, so its tables are audited full rather than empty;
// the test servers count into memory (STATS_STORE=memory), never a real store.
{
  const PASSWORD = process.env.DASHBOARD_PASSWORD ?? 'test-dashboard-password';
  const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
  for (const event of [
    { e: 'view', path: '/esim/japan', entry: true, ref: 'www.google.com' },
    { e: 'search', to: [{ cc: 'FR', days: 5 }, { cc: 'IT', days: 4 }], usage: 'regular', gb: false, currency: 'ILS', count: 0 },
    { e: 'click', provider: 'yesim', to: 'JP', pos: 1, cheapest: true },
    { e: 'booking', step: 'hotels', to: 'JP' },
  ]) {
    await fetch(`${BASE}/api/e`, { method: 'POST', body: JSON.stringify(event), headers: { 'user-agent': CHROME, origin: BASE } });
  }
  // A review waiting, so the approval page has one to show.
  {
    const visitor = await browser.newPage();
    await visitor.goto(`${BASE}/reviews`, { waitUntil: 'domcontentloaded' });
    await visitor.waitForTimeout(800);
    await visitor.getByLabel(/מאיזה ספק קניתם/).selectOption('yesim');
    await visitor.getByLabel(/לאיזה יעד/).selectOption('IT');
    await visitor.getByLabel(/מתי היה הטיול/).selectOption({ index: 1 });
    await visitor.locator('label', { hasText: /^לא$/ }).click();
    await visitor.getByLabel(/מה כדאי לדעת/).fill('The connection dropped twice in Rome, support answered within an hour.');
    await visitor.getByLabel(/שם להצגה/).fill('Dana');
    await visitor.locator('label', { hasText: 'מסכימים שהביקורת תפורסם' }).click();
    await visitor.waitForTimeout(2700);
    await visitor.getByRole('button', { name: 'שליחת הביקורת' }).click();
    await visitor.waitForTimeout(1500);
    await visitor.close();
  }
  for (const [label, viewport, path] of [
    ['dashboard', { width: 1400, height: 1000 }, '/admin'],
    ['dashboard, phone', { width: 390, height: 844 }, '/admin'],
    ['dashboard: reviews waiting', { width: 1400, height: 1000 }, '/admin/reviews'],
    ['dashboard: reviews waiting, phone', { width: 390, height: 844 }, '/admin/reviews'],
  ]) {
    const owner = await browser.newContext({ httpCredentials: { username: 'owner', password: PASSWORD }, viewport });
    const dash = await owner.newPage();
    const response = await dash.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    if (response?.status() !== 200) {
      findings.push({ label, id: 'not-served', impact: 'serious', help: `${path} answered ${response?.status()} — is DASHBOARD_PASSWORD set on the test server?`, nodes: 0, example: '' });
    } else {
      await dash.$$eval('details', (all) => all.forEach((d) => { d.open = true; }));
      const result = await audit(dash, label);
      console.log(`${label}: ${result.violations.length} violation types, ${result.passes.length} rules passing`);
    }
    await owner.close();
  }
}

console.log('\n--- violations ---');
if (findings.length === 0) console.log('none');
for (const f of findings) {
  console.log(`[${f.impact}] ${f.id} — ${f.help}\n    ${f.label}, ${f.nodes} node(s), e.g. ${f.example}`);
}

await browser.close();
process.exit(findings.some((f) => f.impact === 'critical' || f.impact === 'serious') ? 1 : 0);
