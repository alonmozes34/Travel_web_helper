import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { buyLinkLandsOnPlan, DURATION_LINK_ALLOWED, planSourcesFromEnv } from '@/lib/catalogue/getCatalogue';
import { promotions } from '@/data/promotions';
import { applyPromotions } from '@/lib/pricing/promotions';
import { mapZensimOffer, offersInPage, type ZensimOffer } from '@/lib/sources/zensim/mapOffer';
import { keptAcrossDeployments, zensimAffiliateIdFromEnv, zensimSource, type ZensimPersist, type ZensimSnapshot } from '@/lib/sources/zensim/zensimSource';
import type { Plan } from '@/lib/types/plan';

const japan = readFileSync(new URL('./fixtures/zensim-japan.html', import.meta.url), 'utf8');
const T = '2026-09-29T09:00:00.000Z';
const offer = (id: string, price = '23.00', extra = ''): ZensimOffer => {
  const [, , , , days] = /^([A-Z]+)-([A-Z]+)-([A-Z0-9.]+)-(\d+)-days$/.exec(id) ?? [];
  return {
    url: `https://zensim.com/travel-esims/japan/?id=${id}&plan=x&duration=${days ?? ''}&currency=USD${extra}`,
    name: id,
    price,
    priceCurrency: 'USD',
  };
};
const planOf = (o: ZensimOffer): Plan => {
  const mapped = mapZensimOffer(o, 'yeshklita', T);
  assert.ok('plan' in mapped, `expected a plan, got ${JSON.stringify(mapped)}`);
  return mapped.plan;
};

describe('reading a ZenSim country page', () => {
  test('every offer in its schema.org data, once each', () => {
    const offers = offersInPage(japan);
    assert.equal(offers.length, 13, 'Japan: 13 plans on 29 September 2026, listed twice on the page');
    assert.ok(offers.every((o) => typeof o.url === 'string' && String(o.url).includes('?id=USD-JP-')));
  });

  test('a page without the data gives nothing, not an error', () => {
    assert.deepEqual(offersInPage('<html><script type="application/ld+json">{not json</script></html>'), []);
  });
});

describe('mapping a ZenSim offer', () => {
  test('country, data, days and list price come from the offer', () => {
    const plan = planOf(offersInPage(japan).find((o) => String(o.url).includes('USD-JP-20GB-15-days'))!);
    assert.equal(plan.id, 'zensim-USD-JP-20GB-15-days');
    assert.equal(plan.providerId, 'zensim');
    assert.deepEqual(plan.coverage.countries, ['JP']);
    assert.equal(plan.coverage.kind, 'country');
    assert.equal(plan.dataAmountMb, 20 * 1024);
    assert.equal(plan.validityDays, 15);
    assert.equal(plan.sourceCurrency, 'USD');
    assert.equal(plan.originalPriceMinor, 2300);
    assert.equal(plan.finalPriceMinor, 2300, 'the list price; the 10% is for a first purchase only');
    assert.equal(plan.planName, 'Japan 20GB 15 Days');
  });

  test('what the offer does not state stays unstated', () => {
    const plan = planOf(offer('USD-JP-UNLIMITED-5-days', '25.00'));
    assert.equal(plan.isUnlimited, true);
    assert.equal(plan.dataAmountMb, 0);
    assert.deepEqual(plan.fairUsage, { thresholdMb: null, per: null, throttledToKbps: null });
    assert.deepEqual(plan.networks, []);
    assert.equal(plan.hotspot, null);
    assert.equal(plan.calls, null);
  });

  test('an allowance in MB is read as MB', () => {
    assert.equal(planOf(offer('USD-JP-500MB-1-days', '2.00')).dataAmountMb, 500);
  });

  test('the link is the offer\'s own, with our affiliate id, landing on the plan\'s duration', () => {
    const plan = planOf(offer('USD-JP-20GB-15-days'));
    const url = new URL(plan.affiliateUrl!);
    assert.equal(url.origin + url.pathname, 'https://zensim.com/travel-esims/japan/');
    assert.equal(url.searchParams.get('id'), 'USD-JP-20GB-15-days');
    assert.equal(url.searchParams.get('duration'), '15');
    assert.equal(url.searchParams.get('via'), 'yeshklita');
    assert.equal(plan.affiliateLandsOn, 'duration');
  });

  test('a regional plan is skipped: which countries it covers is not in the data', () => {
    const mapped = mapZensimOffer(offer('USD-REGION-ASIA-1GB-5-days', '5.00'), 'yeshklita', T);
    assert.ok('skipped' in mapped);
    assert.equal(mapped.skipped.reason, 'unknown-destination');
  });

  test('a country code we do not know is skipped, not guessed (Netherlands Antilles, AN)', () => {
    const mapped = mapZensimOffer(offer('USD-AN-1GB-5-days', '5.00'), 'yeshklita', T);
    assert.ok('skipped' in mapped);
  });

  test('a link whose duration is not the plan\'s is skipped: it would open the wrong tab', () => {
    const bad: ZensimOffer = { ...offer('USD-JP-5GB-15-days'), url: 'https://zensim.com/travel-esims/japan/?id=USD-JP-5GB-15-days&duration=30' };
    assert.ok('skipped' in mapZensimOffer(bad, 'yeshklita', T));
  });

  test('a price that is not US dollars, or not a price, is skipped', () => {
    assert.ok('skipped' in mapZensimOffer({ ...offer('USD-JP-5GB-15-days'), priceCurrency: 'EUR' }, 'yeshklita', T));
    assert.ok('skipped' in mapZensimOffer(offer('USD-JP-5GB-15-days', ''), 'yeshklita', T));
    assert.ok('skipped' in mapZensimOffer({ ...offer('USD-JP-5GB-15-days'), url: 'https://example.com/?id=USD-JP-5GB-15-days&duration=15' }, 'yeshklita', T));
  });
});

describe('the buy-link rule and its ZenSim exception', () => {
  const zensim = planOf(offer('USD-JP-20GB-15-days'));

  test('a ZenSim link that opens the plan\'s duration is listed — the owner\'s exception', () => {
    assert.deepEqual([...DURATION_LINK_ALLOWED], ['zensim']);
    assert.equal(buyLinkLandsOnPlan(zensim), true);
  });

  test('the exception is ZenSim\'s alone: any other provider needs a plan link', () => {
    assert.equal(buyLinkLandsOnPlan({ ...zensim, providerId: 'yesim' }), false);
    assert.equal(buyLinkLandsOnPlan({ ...zensim, affiliateLandsOn: 'destination' }), false);
    assert.equal(buyLinkLandsOnPlan({ ...zensim, affiliateUrl: null }), false);
  });
});

describe('the ZenSim discount', () => {
  test('YESHKLITA10 is shown as applied by the link, and the list price still ranks', () => {
    const [plan] = applyPromotions([planOf(offer('USD-JP-20GB-15-days'))], promotions, '2026-09-29');
    assert.equal(plan.discount?.code, 'YESHKLITA10');
    assert.equal(plan.discount?.percent, 10);
    assert.equal(plan.discount?.appliedByLink, true);
    assert.equal(plan.discount?.audience, 'newCustomers');
    assert.equal(plan.finalPriceMinor, 2300);
  });
});

describe('the source', () => {
  const sitemap = (slugs: string[]) =>
    `<urlset>${slugs.map((slug) => `<url><loc>https://zensim.com/travel-esims/${slug}/</loc></url>`).join('')}<url><loc>https://zensim.com/blog/x/</loc></url></urlset>`;

  test('reads the country pages from the sitemap, skipping regions, and maps their offers', async () => {
    const asked: string[] = [];
    const source = zensimSource({
      affiliateId: 'yeshklita',
      minPlans: 1,
      minPages: 1,
      fetchText: async (url, limit) => {
        asked.push(url);
        if (url.endsWith('/sitemap.xml')) return sitemap(['japan', 'asia', 'europe', 'global']);
        assert.ok(limit && limit <= 300 * 1024, 'only the start of each page is read');
        return japan;
      },
    });
    const result = await source.fetch();
    assert.equal(result.plans.length, 13);
    assert.deepEqual(asked, ['https://zensim.com/sitemap.xml', 'https://zensim.com/travel-esims/japan/']);
  });

  test('a thin read is a failure, not a smaller catalogue', async () => {
    const source = zensimSource({
      affiliateId: 'yeshklita',
      fetchText: async (url) => (url.endsWith('/sitemap.xml') ? sitemap(['japan']) : japan),
    });
    await assert.rejects(source.fetch(), /country pages|plans/);
  });

  test('the first visitor does not wait for the whole read: the page goes out without ZenSim', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const source = zensimSource({
      affiliateId: 'yeshklita',
      minPlans: 1,
      minPages: 1,
      firstLoadWaitMs: 20,
      fetchText: async (url) => {
        if (url.endsWith('/sitemap.xml')) return sitemap(['japan']);
        await gate;
        return japan;
      },
    });
    await assert.rejects(source.fetch(), /still loading/);
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal((await source.fetch()).plans.length, 13, 'once read, it is served');
  });

  test('a new server takes the catalogue from the shared copy, without reading ZenSim again', async () => {
    let reads = 0;
    let store: Promise<ZensimSnapshot> | null = null;
    const persist: ZensimPersist = (load) => () => (store ??= load());
    const make = () =>
      zensimSource({
        affiliateId: 'yeshklita',
        minPlans: 1,
        minPages: 1,
        persist,
        fetchText: async (url) => {
          reads += 1;
          return url.endsWith('/sitemap.xml') ? sitemap(['japan']) : japan;
        },
      });
    assert.equal((await make().fetch()).plans.length, 13);
    const readsByFirst = reads;
    const second = await make().fetch();
    assert.equal(second.plans.length, 13);
    assert.equal(reads, readsByFirst, 'the second server read nothing');
    assert.ok(second.plans.every((plan) => new URL(plan.affiliateUrl!).searchParams.get('via') === 'yeshklita'));
  });

  test('on only when the affiliate id is in the environment', () => {
    assert.equal(zensimAffiliateIdFromEnv({}), null);
    assert.equal(zensimAffiliateIdFromEnv({ ZENSIM_AFFILIATE_ID: ' yeshklita ' }), 'yeshklita');
    assert.equal(zensimAffiliateIdFromEnv({ ZENSIM_AFFILIATE_ID: 'a b' }), null);
    assert.deepEqual(planSourcesFromEnv({ ZENSIM_AFFILIATE_ID: 'yeshklita' }).map((s) => s.id), ['zensim']);
    assert.deepEqual(planSourcesFromEnv({ DEMO_CATALOGUE: 'true' }).map((s) => s.id), ['mock']);
  });
});

describe('ZenSim kept across deployments', () => {
  const snapshot = (fetchedAt: string): ZensimSnapshot => ({ fetchedAt, offers: [] });
  const HOUR = 60 * 60 * 1000;
  const now = () => Date.parse('2026-10-05T12:00:00Z');

  test('with nothing kept, a visitor waits for the read, and it is kept', async () => {
    const written: ZensimSnapshot[] = [];
    const get = keptAcrossDeployments(async () => snapshot('2026-10-05T12:00:00Z'), {
      read: async () => null,
      write: async (s) => void written.push(s),
    }, { now });
    assert.equal((await get()).fetchedAt, '2026-10-05T12:00:00Z');
    assert.equal(written.length, 1);
  });

  test('a recent copy is used as it is, and ZenSim is not read', async () => {
    let reads = 0;
    const get = keptAcrossDeployments(async () => { reads += 1; return snapshot('x'); }, {
      read: async () => snapshot('2026-10-05T09:00:00Z'),
      write: async () => {},
    }, { now });
    assert.equal((await get()).fetchedAt, '2026-10-05T09:00:00Z');
    assert.equal(reads, 0);
  });

  test('an old copy is served at once, and replaced after the response', async () => {
    const written: ZensimSnapshot[] = [];
    let pending: Promise<unknown> | null = null;
    const get = keptAcrossDeployments(async () => snapshot('2026-10-05T12:00:00Z'), {
      read: async () => snapshot(new Date(now() - 7 * HOUR).toISOString()),
      write: async (s) => void written.push(s),
    }, { now, background: (work) => { pending = work; } });
    assert.equal((await get()).fetchedAt, new Date(now() - 7 * HOUR).toISOString());
    assert.ok(pending, 'a refresh was started');
    await pending;
    assert.equal(written[0]?.fetchedAt, '2026-10-05T12:00:00Z');
  });

  test('a failed refresh keeps the old copy', async () => {
    let pending: Promise<unknown> | null = null;
    const old = snapshot(new Date(now() - 7 * HOUR).toISOString());
    const get = keptAcrossDeployments(async () => { throw new Error('ZenSim down'); }, {
      read: async () => old,
      write: async () => assert.fail('nothing should be written'),
    }, { now, background: (work) => { pending = work; } });
    assert.equal(await get(), old);
    await pending;
  });
});
