/**
 * Negative, boundary and injection checks at the HTTP level.
 *
 * Everything a visitor can put in a URL and should not be able to break:
 * routes that must not exist, malformed trip parameters, values at and past
 * their limits, and markup payloads that must never come back as live HTML.
 *
 *   npm run build && npm run start &
 *   BASE_URL=http://localhost:3000 node tests/negative.mjs
 *
 * Also runs against production, which is where it found that the host refuses
 * an encoded path traversal at the edge with 400 while the app 404s it — both
 * refusals, so the check asserts 4xx rather than one number.
 */
const B = process.env.BASE_URL ?? 'http://localhost:3000';
let pass = 0, fail = 0;
const out = [];
const check = (group, label, cond, detail = '') => {
  if (cond) pass += 1;
  else fail += 1;
  out.push(`  ${cond ? 'PASS' : 'FAIL'}  ${group.padEnd(11)} ${label}${detail ? ' — ' + detail : ''}`);
};

async function get(path) {
  const r = await fetch(B + path, { redirect: 'manual' });
  const body = r.status < 400 ? await r.text() : '';
  return { status: r.status, location: r.headers.get('location'), body };
}
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const prices = (html) => (text(html).match(/₪\s*\d/g) ?? []).length;

// ── negative: routes that must not exist ──────────────────────────────────
for (const [p, want] of [
  ['/esim/not-a-country', 404],
  // Refused is what matters, not which refusal: the host rejects an encoded
  // traversal at the edge with 400, the app itself 404s it. Asserting 404
  // exactly failed against production for being *more* strict.
  ['/esim/%2e%2e%2f%2e%2e%2fetc%2fpasswd', '4xx'],
  ['/esim/THAILAND', 404],
  ['/no-such-page', 404],
  ['/fr', 404],
]) {
  const r = await get(p);
  const okStatus = want === '4xx' ? r.status >= 400 && r.status < 500 : r.status === want;
  check('negative', `${p} -> ${want}`, okStatus, `got ${r.status}`);
}

// ── negative: malformed trip parameters must not crash or invent results ──
const malformed = [
  ['/search?to=', 'empty destination'],
  ['/search?to=XX:5', 'unknown country code'],
  ['/search?to=TH:0', 'zero days'],
  ['/search?to=TH:-5', 'negative days'],
  ['/search?to=TH:abc', 'non-numeric days'],
  ['/search?to=TH:99999', 'absurd days'],
  ['/search?to=TH:5&usage=bogus', 'unknown usage'],
  ['/search?to=TH:5&usage=regular&gb=-1', 'negative GB'],
  ['/search?to=TH:5&usage=regular&gb=abc', 'non-numeric GB'],
  ['/search?to=TH:5&usage=regular&gb=1e99', 'exponent GB'],
  ['/search?to=TH:5&usage=regular&sort=bogus', 'unknown sort'],
  ['/search?to=TH:5&usage=regular&max=-1', 'negative max price'],
  ['/search?to=TH:5&usage=regular&max=abc', 'non-numeric max price'],
  ['/search?to=TH:5&usage=regular&5g=2', 'bad 5g flag'],
  ['/search?to=TH:5&usage=regular&provider=nope', 'unknown provider filter'],
  ['/search?to=TH:5&usage=regular&data=,,,', 'empty filter list'],
  ['/search?to=' + 'TH:5,'.repeat(40), '40 destinations'],
  ['/search?to=TH:5&usage=regular&max=999999999', 'enormous max price'],
];
for (const [p, label] of malformed) {
  const r = await get(p);
  check('negative', label, r.status === 200, `${p} -> ${r.status}`);
}

// ── injection: reflected markup must never survive into the page ──────────
const payloads = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "';DROP TABLE--"];
for (const raw of payloads) {
  const r = await get('/search?to=' + encodeURIComponent(raw));
  // What matters is live markup in the document, not the substring appearing
  // anywhere. Inside Next's flight payload the angle brackets arrive as
  // \u003c / \u003e, which is correct escaping — searching the raw body for
  // "onerror=alert" flags that as a hit and is simply the wrong test.
  const markup = r.body.replace(/<script[\s\S]*?<\/script>/g, '');
  const live = /<img[^>]*onerror/i.test(markup) || /<script[^>]*>\s*alert/i.test(r.body);
  check('injection', `no live markup: ${raw.slice(0, 22)}`, r.status === 200 && !live, `status ${r.status}`);
  // And the payload must be escaped where it does appear, not merely absent.
  const rsc = r.body.includes('\\u003c') || r.body.includes('\\u003e') || !r.body.includes(raw.slice(0, 8));
  check('injection', `payload is escaped, not raw: ${raw.slice(0, 16)}`, rsc);
}

// ── boundary: GB clamps, day ranges ───────────────────────────────────────
const bounds = [
  ['/search?to=TH:1&usage=regular', 'minimum 1 day'],
  ['/search?to=TH:365&usage=regular', '365 days'],
  ['/search?to=TH:14&gb=0.1', 'GB = 0.1'],
  ['/search?to=TH:14&gb=1000', 'GB at the 1000 cap'],
  ['/search?to=TH:14&gb=100000', 'GB far over the cap'],
];
for (const [p, label] of bounds) {
  const r = await get(p);
  check('boundary', label, r.status === 200, `-> ${r.status}`);
}
// The cap must actually clamp, not just survive.
{
  const r = await get('/search?to=TH:14&gb=100000');
  const t = text(r.body);
  check('boundary', 'GB over the cap is clamped, not echoed', !t.includes('100000'), t.includes('100000') ? 'echoed 100000' : 'clamped');
}

// ── sanity: the things that must always be true ───────────────────────────
{
  const home = await get('/');
  check('sanity', 'homepage renders the brand', home.body.includes('יש קליטה'), `status ${home.status}`);
  check('sanity', 'homepage shows no prices', prices(home.body) === 0, `${prices(home.body)} prices`);
  const th = await get('/esim/thailand?days=14&usage=regular');
  check('sanity', 'country page renders plans', prices(th.body) > 5, `${prices(th.body)} prices`);
  check('sanity', 'demo banner present wherever prices are', text(th.body).includes('נתוני הדגמה'));
  const brands = ['Airalo','Nomad','Saily','Ubigi','Holafly','Yesim','aloSIM','Maya','Discover ','Eurolink','Mamma Mia'];
  const found = brands.filter((b) => text(th.body).includes(b));
  check('sanity', 'no real company or product name anywhere', found.length === 0, found.join(', '));
}

// ── regression: locale and redirect contract ──────────────────────────────
for (const [p, want, loc] of [
  ['/he', 307, '/'],
  ['/he/esim/thailand', 307, '/esim/thailand'],
]) {
  const r = await get(p);
  check('regression', `${p} redirects to ${loc}`, r.status === want && (r.location ?? '').endsWith(loc), `${r.status} ${r.location}`);
}
{
  const en = await get('/en');
  check('regression', '/en serves English LTR', en.status === 200 && en.body.includes('dir="ltr"'));
  const ar = await get('/robots.txt');
  check('regression', 'robots disallows everything', ar.body.includes('Disallow: /'));
  const sm = await get('/sitemap.xml');
  check('regression', 'sitemap is well formed', sm.status === 200 && sm.body.startsWith('<?xml'));
  const mf = await get('/manifest.webmanifest');
  check('regression', 'manifest parses', mf.status === 200 && JSON.parse(mf.body).short_name === 'יש קליטה?');
}

// ── shared-URL contract: a filtered link must reproduce its result set ────
{
  const a = await get('/esim/thailand?days=14&usage=regular&5g=1');
  const b = await get('/esim/thailand?days=14&usage=regular&5g=1');
  check('regression', 'a filtered link is deterministic', prices(a.body) === prices(b.body), `${prices(a.body)} vs ${prices(b.body)}`);
  const unfiltered = await get('/esim/thailand?days=14&usage=regular');
  check('regression', 'the 5G filter actually narrows', prices(a.body) < prices(unfiltered.body), `${prices(a.body)} vs ${prices(unfiltered.body)}`);
}

// ══ no link on the site may lead nowhere ═════════════════════════════════
// The footer linked to /disclosure, /privacy and /terms from every page and
// all three returned 404 — including the affiliate disclosure, on a site
// whose whole argument is that its ranking is not for sale.
{
  const seen = new Set();
  const dead = [];
  for (const path of ['/', '/en', '/accessibility', '/disclosure', '/esim/thailand?days=14&usage=regular', '/search?to=GR:3,JP:5&usage=regular', '/unlock']) {
    const html = await (await fetch(B + path)).text();
    for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const href = m[1];
      if (seen.has(href) || href.startsWith('//')) continue;
      seen.add(href);
      const res = await fetch(B + href, { redirect: 'follow' });
      if (!res.ok) dead.push(`${href} -> ${res.status} (from ${path})`);
    }
  }
  check('links', 'every internal link resolves', dead.length === 0, dead.slice(0, 4).join(' ; ') || `${seen.size} checked`);
}

// ══ a URL cannot describe a trip the interface would refuse ══════════════
for (const [label, path, expect] of [
  ['a code that is not a country', '/search?to=ZZ:5&usage=regular', 'empty'],
  ['a real code beside a fake one', '/search?to=ZZ:5,TH:3&usage=regular', 'eSIM לתאילנד'],
  ['the same stop twice', '/search?to=TH:5,TH:3&usage=regular', 'eSIM לתאילנד'],
]) {
  const html = await (await fetch(B + path)).text();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
  const ok = expect === 'empty' ? !h1.includes('ZZ') : h1 === expect;
  check('url trips', label, ok, `h1="${h1}"`);
}

// ══ the impact.com ownership tag must be in <head> on every page ═════════
// It is how the affiliate platform verifies the site belongs to us, and it is
// only checked when someone clicks "Add Website" — so a page that quietly
// lost it would not be noticed until an application failed.
{
  // Every token ever issued, because the platform mints a new one each time
  // the dialog is opened and the older ones must keep working.
  const tokens = [
    'd5ba34ba-7ca1-49fb-b386-c8a19431adb7',
    '425e3bf5-065d-4c1d-86c7-eb675f47b795',
    '41734050-b592-4c9b-be4c-ad4b6a459efa',
    '4e7ce5f5-af45-4489-946e-4e9bc79dd979',
  ];
  const missing = [];
  for (const path of ['/', '/en', '/esim/thailand', '/search?to=TH:5&usage=regular', '/accessibility', '/disclosure']) {
    const html = await (await fetch(B + path)).text();
    const head = html.slice(0, html.indexOf('</head>'));
    for (const token of tokens) {
      // Their own spelling uses `value`; the standard one uses `content`.
      const hasValue = head.includes(`name="impact-site-verification" value="${token}"`);
      const hasContent = head.includes(`name="impact-site-verification" content="${token}"`);
      if (!hasValue || !hasContent) missing.push(`${path} ${token.slice(0, 8)}${hasValue ? '' : ' [no value=]'}${hasContent ? '' : ' [no content=]'}`);
    }
  }
  check('verification', 'every impact.com token is in <head>, both spellings', missing.length === 0, missing.join(' ; ') || `6 pages x ${tokens.length} tokens`);
}

// ── currency in a URL ────────────────────────────────────────────────────
{
  // A link that lands somebody in their own language and currency at once.
  // The parameter is attacker-reachable like any other, so nonsense must be
  // ignored rather than corrected into a redirect loop.
  const cases = [
    ['EUR', 'EUR'],
    ['usd', 'USD'],
    ['AUD', 'AUD'],
  ];
  for (const [given, expected] of cases) {
    const response = await fetch(`${B}/esim/france?currency=${given}`, { redirect: 'manual' });
    const cookie = response.headers.get('set-cookie') ?? '';
    const location = response.headers.get('location') ?? '';
    check(
      'currency',
      `?currency=${given} sets ${expected} and drops the parameter`,
      response.status === 307 && cookie.includes(`yeshklita_currency=${expected}`) && !location.includes('currency='),
      `${response.status} ${location}`,
    );
  }

  for (const junk of ['XYZ', '', '../../etc', 'EUR%00']) {
    const response = await fetch(`${B}/esim/france?currency=${encodeURIComponent(junk)}`, { redirect: 'manual' });
    check('currency', `nonsense currency is ignored: ${JSON.stringify(junk)}`, response.status === 200, String(response.status));
  }

  // The trip survives the hop, and the page really does render in it.
  const landing = await fetch(`${B}/en/esim/france?to=FR:5&usage=regular&currency=AUD`, { redirect: 'manual' });
  const next = landing.headers.get('location') ?? '';
  check('currency', 'the trip survives the currency redirect', next.includes('to=FR') && next.includes('usage=regular'), next);
}


console.log(out.join('\n'));

console.log(`\n  ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
