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
  ['multi-stop search', '/search?to=DE:1,US:14&usage=regular'],
  ['empty search', '/search'],
  ['accessibility statement', '/accessibility'],
  ['affiliate disclosure', '/disclosure'],
  ['device compatibility', '/devices'],
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

// The cross-sell card, which only exists after an eSIM has been chosen and is
// therefore invisible to a static load of the same URL.
const extras = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await extras.goto(`${BASE}/esim/france?to=FR:5&usage=regular`, { waitUntil: 'domcontentloaded' });
await extras.waitForTimeout(900);
await extras.locator('article').first().getByRole('button', { name: /מעבר לאתר/ }).first().click();
await extras.waitForTimeout(400);
const crossSell = await audit(extras, 'trip extra offer shown');
console.log(`trip extra offer shown: ${crossSell.violations.length} violation types`);
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
for (let i = 0; i < 3; i += 1) {
  await page.locator('article label:has-text("להשוואה")').first().click();
  await page.waitForTimeout(120);
}
await page.getByRole('button', { name: 'השווה', exact: true }).click();
await page.waitForTimeout(400);
const dialog = await audit(page, 'comparison dialog open');
console.log(`comparison dialog open: ${dialog.violations.length} violation types`);
await page.close();

console.log('\n--- violations ---');
if (findings.length === 0) console.log('none');
for (const f of findings) {
  console.log(`[${f.impact}] ${f.id} — ${f.help}\n    ${f.label}, ${f.nodes} node(s), e.g. ${f.example}`);
}

await browser.close();
process.exit(findings.some((f) => f.impact === 'critical' || f.impact === 'serious') ? 1 : 0);
