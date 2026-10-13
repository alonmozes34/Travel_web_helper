import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, test } from 'node:test';

import { POST } from '@/app/api/e/route';
import { en } from '@/i18n/dictionaries/en';
import { he } from '@/i18n/dictionaries/he';
import { ALERT_RULES, alertsFor, notYetSent } from '@/lib/stats/alerts';
import { dashboardAccess } from '@/lib/stats/dashboardAccess';
import { countersFor, deviceOf, isRobot, optedOut, routeOf, sourceOf } from '@/lib/stats/events';
import { alertEmail, weeklyEmail } from '@/lib/stats/report';
import { clearMemoryStore, israelDay, lastDays, memoryStore, statsStoreFromEnv, upstashStore } from '@/lib/stats/store';
import { breakdown, periodOf } from '@/lib/stats/summary';

/**
 * The site's own counting (the owner, 13 October 2026: "anonymous, no
 * cookies; country only"). The tests that matter most are the ones that keep
 * a visitor's own words and identity out of the store: every counter name is
 * built from a known list, and nothing else gets in.
 */

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const context = { country: 'IL', device: 'phone', ownHost: 'www.yeshklita.com' };

/** Every shape a counter name may take. A name outside these is a leak. */
const ALLOWED = [
  /^(views|visits|searches|clicks|cheapest|share:whatsapp)$/,
  /^page:(\/|\/[a-z-]+|\/esim\/\[country\]|\/guides\/\[guide\]|other|404)$/,
  /^lang:(he|en)$/,
  /^(destpage|search|country):[A-Z]{2}$/,
  /^country:unknown$/,
  /^from:(direct|internal|google|bing|facebook|instagram|whatsapp|telegram|x|chatgpt|other-site)$/,
  /^device:(phone|tablet|desktop)$/,
  /^region:[a-z-]+$/,
  /^days:(1-3|4-7|8-14|15-30|31\+|unstated)$/,
  /^stops:(1|2|3\+)$/,
  /^(combo|zero):[A-Z]{2}(\+[A-Z]{2})*$/,
  /^usage:(navigation|light|regular|heavy|hotspot|unlimited|stated-gb|unstated)$/,
  /^currency:[A-Z]{3}$/,
  /^click:[a-z0-9-]+(:[A-Z]{2})?$/,
  /^position:(1|2|3|4-10|11\+|combination)$/,
  /^code:[a-z0-9-]+$/,
  /^booking:(reminder|continued|card|hotels|cars|decline|page-hotels|page-cars)(:[A-Z]{2})?$/,
];
const allowed = (name: string) => ALLOWED.some((pattern) => pattern.test(name));

describe('what an event becomes', () => {
  test('a visit from Google to a country page', () => {
    const counts = countersFor({ e: 'view', path: '/esim/japan', entry: true, ref: 'www.google.co.il' }, context);
    assert.deepEqual(counts, {
      views: 1,
      'page:/esim/[country]': 1,
      'lang:he': 1,
      'destpage:JP': 1,
      visits: 1,
      'from:google': 1,
      'device:phone': 1,
      'country:IL': 1,
    });
  });

  test('a page inside the visit is not a visit, and the address is reduced to its route', () => {
    const counts = countersFor({ e: 'view', path: '/en/search?to=JP:7&usage=heavy', entry: false, ref: null }, context);
    assert.deepEqual(counts, { views: 1, 'page:/search': 1, 'lang:en': 1 });
  });

  test('an address that is not a page is "other", and a missing page is a 404 — never the address', () => {
    const typed = '/esim/my-secret-trip-to-grandma';
    assert.deepEqual(countersFor({ e: 'view', path: typed, entry: false, ref: null }, context), { views: 1, 'page:other': 1, 'lang:he': 1 });
    assert.deepEqual(countersFor({ e: 'view', path: '/whatever', entry: false, ref: null, notFound: true }, context), {
      views: 1,
      'page:404': 1,
      'lang:he': 1,
    });
  });

  test('an unknown country header is "unknown"', () => {
    const counts = countersFor({ e: 'view', path: '/', entry: true, ref: null }, { ...context, country: 'XX' });
    assert.equal(counts?.['country:unknown'], 1);
    assert.equal(counts?.['from:direct'], 1);
  });

  test('a search: countries, regions, length only when given, stops, combination, use, currency', () => {
    const counts = countersFor(
      { e: 'search', to: [{ cc: 'IT', days: 5 }, { cc: 'FR', days: 4 }], usage: 'regular', gb: false, currency: 'ILS', count: 31 },
      context,
    );
    assert.deepEqual(counts, {
      searches: 1,
      'search:FR': 1,
      'search:IT': 1,
      'region:europe': 2,
      'days:8-14': 1,
      'stops:2': 1,
      'combo:FR+IT': 1,
      'usage:regular': 1,
      'currency:ILS': 1,
    });
    const unstated = countersFor({ e: 'search', to: [{ cc: 'TH' }], usage: null, gb: true, currency: 'USD', count: 0 }, context);
    assert.equal(unstated?.['days:unstated'], 1);
    assert.equal(unstated?.['usage:stated-gb'], 1);
    assert.equal(unstated?.['zero:TH'], 1);
  });

  test('a click: provider, destination, position, cheapest; a combination leg is position 0', () => {
    assert.deepEqual(countersFor({ e: 'click', provider: 'saily', to: 'JP', pos: 2, cheapest: true }, context), {
      clicks: 1,
      'click:saily': 1,
      'click:saily:JP': 1,
      'position:2': 1,
      cheapest: 1,
    });
    assert.equal(countersFor({ e: 'click', provider: 'yesim', to: null, pos: 0, cheapest: false }, context)?.['position:combination'], 1);
    assert.equal(countersFor({ e: 'click', provider: 'yesim', to: 'JP', pos: 14, cheapest: false }, context)?.['position:11+'], 1);
  });

  test('Booking steps, with the destination only where it means something', () => {
    assert.deepEqual(countersFor({ e: 'booking', step: 'hotels', to: 'GR' }, context), { 'booking:hotels': 1, 'booking:hotels:GR': 1 });
    assert.deepEqual(countersFor({ e: 'booking', step: 'reminder', to: 'GR' }, context), { 'booking:reminder': 1 });
  });

  test('anything not on the list is dropped, not stored some other way', () => {
    for (const event of [
      null,
      'view',
      { e: 'pageview', path: '/' },
      { e: 'click', provider: 'not-a-provider', to: 'JP', pos: 1, cheapest: false },
      { e: 'click', provider: 'saily', to: 'JP', pos: -1, cheapest: false },
      { e: 'search', to: [{ cc: 'ZZ', days: 3 }], usage: null, gb: false, currency: 'ILS', count: 1 },
      { e: 'search', to: 'JP', usage: null, gb: false, currency: 'ILS', count: 1 },
      { e: 'booking', step: 'checkout', to: 'JP' },
      { e: 'share', channel: 'email' },
      { e: 'code', provider: '../etc' },
      { e: 'view', path: 'x'.repeat(201), entry: false, ref: null },
    ]) {
      assert.equal(countersFor(event, context), null, JSON.stringify(event)?.slice(0, 80));
    }
  });

  test('no counter name can carry what a visitor typed', () => {
    const typed = ['<script>', 'john@example.com', '0501234567', 'רחוב הרצל 5', 'JP:7&usage=heavy', 'a'.repeat(50)];
    const events = typed.flatMap((text) => [
      { e: 'view', path: `/${text}`, entry: true, ref: text },
      { e: 'view', path: `/esim/${text}`, entry: true, ref: `${text}.com` },
      { e: 'search', to: [{ cc: text, days: 3 }, { cc: 'JP', days: text }], usage: text, gb: false, currency: text, count: 0 },
      { e: 'click', provider: text, to: text, pos: 1, cheapest: false },
      { e: 'click', provider: 'saily', to: text, pos: 1, cheapest: false },
      { e: 'booking', step: 'hotels', to: text },
      { e: 'code', provider: text },
    ]);
    for (const event of events) {
      for (const name of Object.keys(countersFor(event, { ...context, country: typed[0] }) ?? {})) {
        assert.ok(allowed(name), `counter "${name}" is not one of the known shapes`);
        for (const text of typed) assert.ok(!name.includes(text), `counter "${name}" carries "${text}"`);
      }
    }
  });
});

describe('who is counted', () => {
  test('where a visit came from, by the site name only', () => {
    assert.equal(sourceOf(null, 'www.yeshklita.com'), 'direct');
    assert.equal(sourceOf('www.yeshklita.com', 'www.yeshklita.com'), 'internal');
    assert.equal(sourceOf('yeshklita.com', 'www.yeshklita.com'), 'internal');
    assert.equal(sourceOf('www.google.co.il', 'www.yeshklita.com'), 'google');
    assert.equal(sourceOf('l.facebook.com', 'www.yeshklita.com'), 'facebook');
    assert.equal(sourceOf('chatgpt.com', 'www.yeshklita.com'), 'chatgpt');
    assert.equal(sourceOf('some-blog.example', 'www.yeshklita.com'), 'other-site');
  });

  test('device class, from a description that is not kept', () => {
    assert.equal(deviceOf(IPHONE), 'phone');
    assert.equal(deviceOf(CHROME), 'desktop');
    assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), 'tablet');
  });

  test('robots and automated browsers, our own suites among them, are not counted', () => {
    for (const ua of ['', 'Googlebot/2.1', 'Mozilla/5.0 HeadlessChrome/141.0', 'curl/8.5', 'node', 'python-requests/2.32', 'facebookexternalhit/1.1']) {
      assert.ok(isRobot(ua), ua);
    }
    assert.ok(!isRobot(CHROME));
    assert.ok(!isRobot(IPHONE));
  });

  test('a browser that asked not to be followed', () => {
    assert.ok(optedOut(new Headers({ 'sec-gpc': '1' })));
    assert.ok(optedOut(new Headers({ dnt: '1' })));
    assert.ok(!optedOut(new Headers({})));
  });

  test('a route and its language, from either form of the address', () => {
    assert.deepEqual(routeOf('/en/esim/japan'), { route: '/esim/[country]', lang: 'en', dest: 'JP' });
    assert.deepEqual(routeOf('/he/esim'), { route: '/esim', lang: 'he', dest: null });
    assert.deepEqual(routeOf('/'), { route: '/', lang: 'he', dest: null });
    assert.deepEqual(routeOf('/guides/before-you-fly'), { route: '/guides/[guide]', lang: 'he', dest: null });
    assert.deepEqual(routeOf('/esim/japan/extra'), { route: 'other', lang: 'he', dest: null });
  });
});

describe('the endpoint', () => {
  beforeEach(() => {
    process.env.STATS_STORE = 'memory';
    clearMemoryStore();
  });

  const send = (body: unknown, headers: Record<string, string> = {}) =>
    POST(
      new Request('https://www.yeshklita.com/api/e', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: { 'user-agent': CHROME, origin: 'https://www.yeshklita.com', 'x-vercel-ip-country': 'DE', ...headers },
      }),
    );
  const today = () => memoryStore().read([israelDay()]).then((days) => days[israelDay()]);

  test('counts a page view, with the host’s country and the device class', async () => {
    const response = await send({ e: 'view', path: '/', entry: true, ref: null });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('set-cookie'), null);
    const counts = await today();
    assert.equal(counts.visits, 1);
    assert.equal(counts['country:DE'], 1);
    assert.equal(counts['device:desktop'], 1);
  });

  test('answers 204 and counts nothing for another site, a browser that opted out, a robot, or junk', async () => {
    await send({ e: 'view', path: '/', entry: true, ref: null }, { origin: 'https://evil.example' });
    await send({ e: 'view', path: '/', entry: true, ref: null }, { 'sec-gpc': '1' });
    await send({ e: 'view', path: '/', entry: true, ref: null }, { 'user-agent': 'Mozilla/5.0 HeadlessChrome/141.0' });
    await send('not json');
    await send('x'.repeat(5_000));
    const response = await send({ e: 'nonsense' });
    assert.equal(response.status, 204);
    assert.deepEqual(await today(), {});
  });

  test('with no store connected, nothing is counted and nothing fails', async () => {
    delete process.env.STATS_STORE;
    const response = await send({ e: 'view', path: '/', entry: true, ref: null });
    assert.equal(response.status, 204);
  });
});

describe('the store', () => {
  test('which store, from the environment', () => {
    assert.equal(statsStoreFromEnv({}), null);
    assert.ok(statsStoreFromEnv({ STATS_STORE: 'memory' }));
    assert.ok(statsStoreFromEnv({ KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' }));
    assert.ok(statsStoreFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' }));
    assert.equal(statsStoreFromEnv({ KV_REST_API_URL: 'https://x.upstash.io' }), null);
  });

  test('Upstash gets one pipeline per call: the increments and the day’s expiry', async () => {
    const calls: Array<{ url: string; body: unknown; auth: string | null }> = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)), auth: new Headers(init.headers).get('authorization') });
      const commands = JSON.parse(String(init.body)) as unknown[][];
      return Response.json(commands.map((command) => ({ result: command[0] === 'HGETALL' ? ['views', '3', 'click:saily', '1'] : 1 })));
    }) as unknown as typeof fetch;
    const store = upstashStore('https://x.upstash.io/', 'secret', fake);
    await store.increment('2026-10-13', { views: 1, 'page:/': 1 });
    assert.equal(calls[0].url, 'https://x.upstash.io/pipeline');
    assert.equal(calls[0].auth, 'Bearer secret');
    assert.deepEqual(calls[0].body, [
      ['HINCRBY', 'yk:stats:2026-10-13', 'views', 1],
      ['HINCRBY', 'yk:stats:2026-10-13', 'page:/', 1],
      ['EXPIRE', 'yk:stats:2026-10-13', 400 * 24 * 60 * 60],
    ]);
    assert.deepEqual(await store.read(['2026-10-13']), { '2026-10-13': { views: 3, 'click:saily': 1 } });
    assert.equal(await store.claim('2026-10-13', 'email:weekly'), true);
  });

  test('the in-memory store, and claiming a mark once', async () => {
    clearMemoryStore();
    const store = memoryStore();
    await store.increment('2026-10-13', { views: 2 });
    await store.increment('2026-10-13', { views: 1, clicks: 1 });
    assert.deepEqual(await store.read(['2026-10-13', '2026-10-12']), { '2026-10-13': { views: 3, clicks: 1 }, '2026-10-12': {} });
    assert.equal(await store.claim('2026-10-13', 'alert:drop'), true);
    assert.equal(await store.claim('2026-10-13', 'alert:drop'), false);
  });

  test('the day is Israel’s', () => {
    assert.equal(israelDay(new Date('2026-10-12T21:30:00Z')), '2026-10-13');
    assert.equal(israelDay(new Date('2026-10-12T20:30:00Z')), '2026-10-12');
    assert.deepEqual(lastDays(3, new Date('2026-10-01T10:00:00Z')), ['2026-09-29', '2026-09-30', '2026-10-01']);
  });
});

describe('the dashboard’s arithmetic, alerts and email', () => {
  const data = {
    '2026-10-11': { visits: 10, searches: 6, clicks: 3, 'click:saily': 2, 'click:saily:JP': 2, 'click:yesim': 1, 'alert:drop': 1 },
    '2026-10-12': { visits: 5, searches: 4, clicks: 2, 'click:saily': 2, 'booking:hotels': 1, 'zero:FR+IT': 1 },
  };

  test('totals leave the store’s own marks out, and a breakdown stays at its depth', () => {
    const period = periodOf(data, ['2026-10-11', '2026-10-12']);
    assert.equal(period.totals.visits, 15);
    assert.equal(period.totals['alert:drop'], undefined);
    assert.deepEqual(breakdown(period, 'click:'), [
      { key: 'saily', count: 4 },
      { key: 'yesim', count: 1 },
    ]);
    assert.deepEqual(breakdown(period, 'click:saily:'), [{ key: 'JP', count: 2 }]);
    assert.equal(period.daily[1].booking, 1);
  });

  test('a provider with no clicks for three days is an alert only once there is traffic to judge by', () => {
    const days = ['2026-10-10', '2026-10-11', '2026-10-12'];
    const quiet = { '2026-10-10': { clicks: 6, 'click:saily': 6 }, '2026-10-11': { clicks: 6, 'click:saily': 6 }, '2026-10-12': { clicks: 6, 'click:saily': 6 } };
    const alerts = alertsFor({ data: quiet, days, sources: [], listedProviders: ['saily', 'yesim'] });
    assert.deepEqual(alerts.map((alert) => alert.key), ['quiet:yesim']);
    const prelaunch = { '2026-10-12': { clicks: 2, 'click:saily': 2 } };
    assert.deepEqual(alertsFor({ data: prelaunch, days, sources: [], listedProviders: ['saily', 'yesim'] }), []);
    assert.equal(ALERT_RULES.quietMinClicks, 15);
  });

  test('a source that failed is an alert; one still on its first read is not', () => {
    const sources = [
      { id: 'zensim', label: 'ZenSim', ok: false, error: 'still loading (first read)' },
      { id: 'saily', label: 'Saily', ok: false, error: 'HTTP 500' },
    ];
    const alerts = alertsFor({ data: {}, days: ['2026-10-12'], sources, listedProviders: [] });
    assert.deepEqual(alerts.map((alert) => alert.key), ['source:saily']);
  });

  test('a sharp drop in visits, many 404s, and a trip that keeps finding nothing', () => {
    const days = lastDays(8, new Date('2026-10-13T10:00:00Z')).slice(0, -1);
    const busy: Record<string, Record<string, number>> = Object.fromEntries(days.map((day) => [day, { visits: 50 }]));
    busy[days.at(-1)!] = { visits: 4, 'page:404': 25, 'zero:FR+IT': 5 };
    const keys = alertsFor({ data: busy, days, sources: [], listedProviders: [] }).map((alert) => alert.key);
    assert.deepEqual(keys, ['drop', '404', 'zero:FR+IT']);
  });

  test('an alert sent in the last three days is not sent again', () => {
    const alerts = [{ key: 'drop', text: '' }, { key: '404', text: '' }];
    const fresh = notYetSent(alerts, { '2026-10-12': { 'alert:drop': 1 } }, ['2026-10-11', '2026-10-12', '2026-10-13']);
    assert.deepEqual(fresh.map((alert) => alert.key), ['404']);
  });

  test('the weekly email names the figures, the providers and the way to the dashboard', () => {
    const week = periodOf(data, ['2026-10-11', '2026-10-12']);
    const before = periodOf({}, ['2026-10-04']);
    const { subject, text } = weeklyEmail({ week, before, alerts: [], dashboardUrl: 'https://www.yeshklita.com/admin' });
    assert.match(subject, /15 כניסות, 5 לחיצות/);
    assert.match(text, /Saily: 4/);
    assert.match(text, /https:\/\/www\.yeshklita\.com\/admin/);
    assert.match(text, /אין התרעות פתוחות/);
    const alert = alertEmail({ alerts: [{ key: 'drop', text: 'אתמול נכנסו 4 מבקרים' }], dashboardUrl: 'x' });
    assert.match(alert.subject, /התרעה/);
  });
});

describe('who may open the dashboard', () => {
  const basic = (password: string) => `Basic ${btoa(`owner:${password}`)}`;

  test('closed without a password, refused with a short one, open only with the right one', () => {
    assert.equal(dashboardAccess(basic('anything'), {}), 'unset');
    assert.equal(dashboardAccess(basic('short'), { DASHBOARD_PASSWORD: 'short' }), 'weak');
    const env = { DASHBOARD_PASSWORD: 'a-long-enough-password' };
    assert.equal(dashboardAccess(null, env), 'denied');
    assert.equal(dashboardAccess(basic('wrong-but-long-enough'), env), 'denied');
    assert.equal(dashboardAccess(`Basic ${btoa(':')}`, env), 'denied');
    assert.equal(dashboardAccess(basic('a-long-enough-password'), env), 'ok');
  });
});

describe('the counts never reach the comparison', () => {
  function sourceFiles(dir: string, found: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) sourceFiles(path, found);
      else if (/\.(ts|tsx)$/.test(entry)) found.push(path);
    }
    return found;
  }

  test('nothing that ranks, prices or lists plans imports the stats', () => {
    const ranking = ['src/lib/comparison', 'src/lib/catalogue', 'src/lib/sources', 'src/lib/affiliate', 'src/data'].flatMap((dir) => sourceFiles(dir));
    assert.ok(ranking.length > 20);
    for (const file of ranking) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /(from|import\()\s*['"](@\/lib\/stats|\.\.?\/(\.\.\/)*stats)/, `${file} imports the stats`);
    }
  });

  test('the privacy page says what is counted, where it is kept, and for how long, in both languages', () => {
    for (const dict of [he, en]) {
      const text = dict.privacyPage.stats.body.join(' ');
      assert.match(text, /Upstash/);
      assert.match(text, /13/);
      assert.match(text, /Global Privacy Control/);
      assert.doesNotMatch(dict.privacyPage.notCollected.items.join(' '), /sends them nowhere|לא שולח אותם לשום מקום/);
    }
  });
});
