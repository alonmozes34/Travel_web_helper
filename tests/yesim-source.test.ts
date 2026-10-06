import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { getProvider } from '@/data/providers';
import { mockFxRates } from '@/data/fxRates';
import { outboundLink } from '@/lib/affiliate/link';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { applyFilters, deriveFilterOptions, emptyFilters } from '@/lib/comparison/filter';
import { planSourcesFromEnv } from '@/lib/catalogue/getCatalogue';
import { mapYesimPlan, yesimPlanLink } from '@/lib/sources/yesim/mapPlan';
import type { YesimPlan } from '@/lib/sources/yesim/types';
import { YESIM_API_BASE, yesimPartnerIdFromEnv, yesimSource } from '@/lib/sources/yesim/yesimSource';

// Eleven plans exactly as Yesim's Prices API returned them on 28 September 2026.
const fixture: YesimPlan[] = JSON.parse(readFileSync(new URL('./fixtures/yesim-prices.json', import.meta.url), 'utf8'));
const byId = (id: string) => fixture.find((item) => item.plan_id === id)!;
const japan10GB = byId('33116');
const japanUnlimited10d = byId('41787');
const northernCyprus = byId('42130');
const antilles = byId('19360');
const europe = byId('31273');
const southEastAsia = byId('31071');
const globalUnlimited = byId('29901');
const thaiUnlimited10d = byId('34193');
// An allowance nobody has seen the page for (1.5GB is not in their catalogue
// today), so a plan that keeps its destination link.
const unseenShape: YesimPlan = { ...southEastAsia, plan_id: 'unseen', capacity: '1536' };

const planOf = (item: YesimPlan) => {
  const mapped = mapYesimPlan(item, '2026-09-28T09:00:00.000Z');
  assert.ok('plan' in mapped, `expected a plan for ${item.planName}`);
  return mapped.plan;
};

describe('mapping a Yesim plan', () => {
  test('a country plan carries exactly what the API says', () => {
    const plan = planOf(japan10GB);
    assert.equal(plan.id, 'yesim-33116');
    assert.equal(plan.providerId, 'yesim');
    assert.equal(plan.planName, 'Japan 10GB 30 Days');
    assert.deepEqual(plan.coverage, { kind: 'country', countries: ['JP'], regionId: null, publishedDestinationCount: null });
    assert.equal(plan.dataAmountMb, 10240);
    assert.equal(plan.isUnlimited, false);
    assert.equal(plan.fairUsage, null);
    assert.equal(plan.validityDays, 30);
    assert.equal(plan.sourceCurrency, 'EUR');
    assert.equal(plan.finalPriceMinor, 1600);
    assert.deepEqual(plan.networks, [], 'the API names no networks, so none are claimed');
    assert.equal(plan.hotspot, null);
    assert.equal(plan.topUp, null);
  });

  test('a price in cents survives: 28.81 is 2881, not 2880 or 2882', () => {
    assert.equal(planOf(japanUnlimited10d).finalPriceMinor, 2881);
  });

  test('"Possible throttling" is a cap whose terms are not stated — not a truly unlimited plan', () => {
    const plan = planOf(japanUnlimited10d);
    assert.equal(plan.isUnlimited, true);
    assert.equal(plan.planName, 'Japan Unlimited 10 Days');
    assert.deepEqual(plan.fairUsage, { thresholdMb: null, per: null, throttledToKbps: null });
  });

  test('a Northern Cyprus plan is not offered as a Turkey plan, even though it lists Turkey', () => {
    assert.deepEqual(northernCyprus.coverages, [{ code: 'TR' }]);
    const mapped = mapYesimPlan(northernCyprus, '2026-09-28T09:00:00.000Z');
    assert.ok('skipped' in mapped);
    assert.equal(mapped.skipped.reason, 'unknown-destination');
  });

  test('the Netherlands Antilles, dissolved in 2010, is skipped rather than guessed at', () => {
    const mapped = mapYesimPlan(antilles, '2026-09-28T09:00:00.000Z');
    assert.ok('skipped' in mapped);
  });

  test('regions keep their own names; only Europe is taken as ours', () => {
    const eu = planOf(europe);
    assert.equal(eu.coverage.kind, 'region');
    assert.equal(eu.coverage.regionId, 'europe');
    assert.equal(eu.planName, 'Europe 500MB 1 Day');
    const sea = planOf(southEastAsia);
    assert.equal(sea.coverage.regionId, null);
    assert.equal(sea.coverage.regionName, 'South East Asia');
  });

  test('a global package is global', () => {
    const plan = planOf(globalUnlimited);
    assert.equal(plan.coverage.kind, 'global');
    assert.ok(plan.coverage.countries.length > 50);
  });

  test('"buy" on a capped country plan opens its own page, with our partner id', () => {
    const plan = planOf(japan10GB);
    assert.equal(plan.affiliateUrl, 'https://yesim.app/country/japan/30days-10gb-esim-data-plan/?partner_id=5581');
    assert.equal(plan.affiliateLandsOn, 'plan');
    assert.equal(outboundLink(plan, 'he')?.href, plan.affiliateUrl);
  });

  test('a plan whose page shape is unknown keeps the destination page and says so', () => {
    const plan = planOf(unseenShape);
    assert.equal(plan.affiliateUrl, 'https://yesim.app/regions/south-east-asia-esim/?partner_id=5581');
    assert.equal(plan.affiliateLandsOn, 'destination');
  });

  test('unreadable records are skipped, never guessed', () => {
    const bad = (patch: Partial<YesimPlan>) => mapYesimPlan({ ...japan10GB, ...patch }, 'now');
    assert.ok('skipped' in bad({ price: '' }));
    assert.ok('skipped' in bad({ price: '0' }));
    assert.ok('skipped' in bad({ price: '1.234' }));
    assert.ok('skipped' in bad({ capacity: 'lots' }));
    assert.ok('skipped' in bad({ capacityUnit: 'GB' }), 'a unit other than MB is not silently read as MB');
    assert.ok('skipped' in bad({ period: '0' }));
    assert.ok('skipped' in bad({ currency: 'XYZ' }));
  });
});

describe('ranking with a cap nobody has stated', () => {
  test('an unlimited plan that "may be throttled" does not beat a cheaper one that states its cap', () => {
    const silent = planOf(thaiUnlimited10d);
    // The same plan at the same price, but with a stated generous daily cap.
    const stated = { ...silent, id: 'stated', fairUsage: { thresholdMb: 10240, per: 'day' as const, throttledToKbps: 1000 } };
    const comparison = buildComparison({
      profile: { destinations: [{ countryCode: 'TH', days: 10 }], usage: 'hotspot' },
      currency: 'EUR',
      plans: [silent, stated],
      rates: mockFxRates,
    });
    const rank = (id: string) => comparison.rows.findIndex((row) => row.plan.id === id);
    assert.ok(rank('stated') < rank(silent.id), 'stating the terms can only help a plan, never hurt it');
  });
});

describe('the Yesim source', () => {
  test('asks the documented endpoint with our partner id and maps the lot', async () => {
    const asked: string[] = [];
    const many = Array.from({ length: 1000 }, (_, index) => ({ ...japan10GB, plan_id: String(90000 + index) }));
    const source = yesimSource({
      partnerId: '5581',
      fetchJson: async (url) => {
        asked.push(url);
        return [...fixture, ...many];
      },
    });
    const result = await source.fetch();
    assert.deepEqual(asked, [`${YESIM_API_BASE}/prices?partner=5581`]);
    assert.equal(result.plans.length, fixture.length - 2 + 1000);
    assert.deepEqual(result.skipped.map((record) => record.externalId).sort(), ['19360', '42130']);
  });

  test('a short response is a failed read, not a smaller catalogue', async () => {
    const source = yesimSource({ partnerId: '5581', fetchJson: async () => fixture });
    await assert.rejects(source.fetch(), /only 11 plans/);
  });

  test('is on only where the partner id is set, and never beside the demo', () => {
    assert.equal(yesimPartnerIdFromEnv({}), null);
    assert.equal(yesimPartnerIdFromEnv({ YESIM_PARTNER_ID: ' 5581 ' }), '5581');
    assert.equal(yesimPartnerIdFromEnv({ YESIM_PARTNER_ID: 'abc' }), null);
    assert.deepEqual(planSourcesFromEnv({ YESIM_PARTNER_ID: '5581', DEMO_CATALOGUE: 'true' }).map((s) => s.id), ['yesim']);
    assert.deepEqual(
      planSourcesFromEnv({ ALOSIM_CLIENT_ID: 'a', ALOSIM_CLIENT_SECRET: 'b', YESIM_PARTNER_ID: '5581' }).map((s) => s.id),
      ['alosim', 'yesim'],
    );
  });

  // Their own header logo since 6 October 2026, at the owner's request; the
  // record must point at a file that is really there.
  test('has a provider record, and its logo file exists', () => {
    const provider = getProvider('yesim');
    assert.equal(provider?.name, 'Yesim');
    assert.equal(provider?.activation, null);
    assert.ok(provider?.logo, 'logo set');
    const file = readFileSync(new URL(`../public${provider!.logo!.src}`, import.meta.url), 'utf8');
    assert.match(file, /^<svg[\s>]/);
    assert.doesNotMatch(file, /<script/i);
  });
});

describe('one plan per length is not one row per length', () => {
  const tenDays = planOf(japanUnlimited10d);
  const longer = (days: number, euros: number) => ({
    ...tenDays,
    id: `yesim-longer-${days}`,
    validityDays: days,
    originalPriceMinor: euros * 100,
    finalPriceMinor: euros * 100,
  });
  const run = (plans: ReturnType<typeof planOf>[], days: number) =>
    buildComparison({
      profile: { destinations: [{ countryCode: 'JP', days }], usage: 'hotspot' },
      currency: 'EUR',
      plans,
      rates: mockFxRates,
    }).rows.map((row) => row.plan.id);

  test('longer, dearer versions of the same unlimited plan are dropped for a trip the shorter one covers', () => {
    const ids = run([tenDays, longer(11, 31), longer(12, 32), planOf(japan10GB)], 10);
    assert.ok(ids.includes(tenDays.id));
    assert.ok(!ids.includes('yesim-longer-11'));
    assert.ok(!ids.includes('yesim-longer-12'));
    assert.ok(ids.includes('yesim-33116'), 'a different kind of plan from the same provider stays');
  });

  test('for a trip longer than the short one, the longer one stays', () => {
    const ids = run([tenDays, longer(12, 32)], 12);
    assert.ok(ids.includes('yesim-longer-12'));
  });

  test("another provider's plan is never dropped this way, however it compares", () => {
    const rival = { ...longer(11, 31), id: 'rival', providerId: 'alosim' };
    assert.ok(run([tenDays, rival], 10).includes('rival'));
  });
});

describe('what the page may say about the Yesim price', () => {
  test('it is their listed price, not "what your card is charged", until the charge currency is confirmed', () => {
    assert.equal(getProvider('yesim')?.billingCurrency, 'not-confirmed');
    assert.equal(getProvider('alosim')?.billingCurrency, 'as-listed');
  });
});

describe('the data filter', () => {
  test('offers 500MB as 500MB, never as "0GB", and filters on the exact amount', () => {
    const rows = buildComparison({
      profile: { destinations: [{ countryCode: 'FR', days: 1 }], usage: 'light' },
      currency: 'EUR',
      plans: [planOf(europe)],
      rates: mockFxRates,
    }).rows;
    const options = deriveFilterOptions(rows);
    assert.deepEqual(options.dataMb, [500]);
    assert.equal(applyFilters(rows, { ...emptyFilters, data: ['500'] }).length, 1);
    assert.equal(applyFilters(rows, { ...emptyFilters, data: ['0'] }).length, 0);
  });
});

describe('only plans whose buy link opens the plan are listed', () => {
  test('a Yesim plan, whose link lands on the country page, is left out; a plan-level link and the demo stay', async () => {
    const { buyLinkLandsOnPlan } = await import('@/lib/catalogue/getCatalogue');
    const yesim = planOf(unseenShape);
    assert.equal(buyLinkLandsOnPlan(yesim), false);
    assert.equal(buyLinkLandsOnPlan({ ...yesim, affiliateLandsOn: 'plan' }), true);
    assert.equal(buyLinkLandsOnPlan({ ...yesim, affiliateUrl: null, affiliateLandsOn: 'plan' }), false, 'no link, no listing');
    assert.equal(buyLinkLandsOnPlan({ ...yesim, source: 'mock', affiliateUrl: null }), true);
  });
});

describe('the address of a Yesim plan page', () => {
  const on = { enabled: true };

  test('a country unlimited plan gets its own page, in the shape seen on their site', () => {
    assert.equal(
      yesimPlanLink(japanUnlimited10d, on),
      'https://yesim.app/country/japan/10days-unlimited-esim-data-plan/?partner_id=5581',
    );
    assert.equal(
      yesimPlanLink(thaiUnlimited10d, on),
      'https://yesim.app/country/thailand/10days-unlimited-esim-data-plan/?partner_id=5581',
    );
  });

  test('the capped shape, days first and whole gigabytes after', () => {
    assert.equal(yesimPlanLink(japan10GB, on), 'https://yesim.app/country/japan/30days-10gb-esim-data-plan/?partner_id=5581');
    assert.equal(
      yesimPlanLink({ ...japan10GB, capacity: '1024' }, on),
      'https://yesim.app/country/japan/30days-1gb-esim-data-plan/?partner_id=5581',
    );
  });

  test('every shape the owner read off their site: one day, under a gigabyte, regions, global', () => {
    assert.equal(
      yesimPlanLink({ ...japanUnlimited10d, period: '1' }, on),
      'https://yesim.app/country/japan/1days-unlimited-esim-data-plan/?partner_id=5581',
    );
    assert.equal(yesimPlanLink(europe, on), 'https://yesim.app/regions/europe-esim/1days-500mb-esim-data-plan/?partner_id=5581');
    assert.equal(
      yesimPlanLink(southEastAsia, on),
      'https://yesim.app/regions/south-east-asia-esim/7days-unlimited-esim-data-plan/?partner_id=5581',
    );
    assert.equal(
      yesimPlanLink(globalUnlimited, on),
      'https://yesim.app/global/global-package-esim/30days-unlimited-esim-data-plan/?partner_id=5581',
    );
  });

  test('shapes nobody has seen are not guessed: part gigabytes, the day pass', () => {
    assert.equal(yesimPlanLink(unseenShape, on), null);
    assert.equal(
      yesimPlanLink({ ...globalUnlimited, directLink: 'https://yesim.app/global/daypass-esim', planName: 'Unlim Day Pass' }, on),
      null,
    );
  });

  test('a link that is not what their API normally sends is not built on', () => {
    assert.equal(yesimPlanLink({ ...japanUnlimited10d, directLink: 'https://evil.example/country/japan' }, on), null);
    assert.equal(yesimPlanLink({ ...japanUnlimited10d, url: 'https://yesim.app/country/japan/' }, on), null, 'no partner id, no link');
  });

  test('on: a country unlimited plan is listed, with the link to its own page', async () => {
    const { buyLinkLandsOnPlan } = await import('@/lib/catalogue/getCatalogue');
    const plan = planOf(japanUnlimited10d);
    assert.equal(plan.affiliateUrl, 'https://yesim.app/country/japan/10days-unlimited-esim-data-plan/?partner_id=5581');
    assert.equal(plan.affiliateLandsOn, 'plan');
    assert.equal(buyLinkLandsOnPlan(plan), true);
    assert.equal(buyLinkLandsOnPlan(planOf(japan10GB)), true, 'and a capped one');
    assert.equal(buyLinkLandsOnPlan(planOf(southEastAsia)), true, 'and a region one');
    assert.equal(buyLinkLandsOnPlan(planOf(unseenShape)), false, 'an unseen shape still has only the region page');
  });

  test('switched off, the plan falls back to the country page and is not listed', async () => {
    const { buyLinkLandsOnPlan } = await import('@/lib/catalogue/getCatalogue');
    assert.equal(yesimPlanLink(japanUnlimited10d, { enabled: false }), null);
    assert.equal(yesimPlanLink(japan10GB, { enabled: false }), null);
    assert.equal(buyLinkLandsOnPlan(planOf(unseenShape)), false);
  });
});
