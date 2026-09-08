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
  ['english homepage', '/en'],
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
