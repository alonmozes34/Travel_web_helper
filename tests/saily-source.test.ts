import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { getProvider } from '@/data/providers';
import { buyLinkLandsOnPlan, planSourcesFromEnv } from '@/lib/catalogue/getCatalogue';
import { mapSailyPlan, sailyPlanLink } from '@/lib/sources/saily/mapPlan';
import { sailyOffered } from '@/data/saily-offered.generated';
import { sailyOffersInPage } from '@/lib/sources/saily/offers';
import { SAILY_API, sailyAffiliateIdFromEnv, sailySource } from '@/lib/sources/saily/sailySource';
import type { SailyPlan } from '@/lib/sources/saily/types';

// Eight plans exactly as Saily's partner API returned them on 9 October 2026,
// and the schema.org data of the five pages they link to, as saily.com
// published it that day.
const fixture: SailyPlan[] = JSON.parse(readFileSync(new URL('./fixtures/saily-plans.json', import.meta.url), 'utf8'));
const page = (name: string) => readFileSync(new URL(`./fixtures/saily-${name}.html`, import.meta.url), 'utf8');
const pages: Record<string, string> = {
  'https://saily.com/esim-thailand/': page('thailand'),
  'https://saily.com/esim-mexico/': page('mexico'),
  'https://saily.com/esim-asia-and-oceania/': page('asia-and-oceania'),
  'https://saily.com/esim-global/': page('global'),
  'https://saily.com/esim-europe/': page('europe'),
};
const named = (name: string, category = 'standard') => fixture.find((item) => item.name === name && item.category === category)!;
const thailand20GB = named('Thailand 20GB 30 days');
const thailandUnlimited7d = named('Thailand UNLIMITED 7 days');
const mexicoUnlimited = named('Mexico UNLIMITED 30 days');
const asiaOceania = named('Asia and Oceania UNLIMITED 10 days');
const hawaii = named('Hawaii 10GB 30 days');
const globalUltra = named('Global 5GB 30 days', 'ultra');
const global1GB = named('Global 1GB 7 days');
const europe5GB = named('Europe 5GB 30 days');

/** What the five pages sell, plan id to US cents — as `check-saily-pages` reads them. */
const offered = new Map<string, number>();
for (const html of Object.values(pages)) for (const [sku, cents] of sailyOffersInPage(html)) offered.set(sku, cents);
const options = { affiliateId: '17062', fetchedAt: '2026-10-09T17:00:00.000Z', offered };
const planOf = (item: SailyPlan) => {
  const mapped = mapSailyPlan(item, options);
  assert.ok('plan' in mapped, `expected a plan for ${item.name}: ${'skipped' in mapped ? mapped.skipped.detail : ''}`);
  return mapped.plan;
};
const skipOf = (item: SailyPlan, offers = offered) => {
  const mapped = mapSailyPlan(item, { ...options, offered: offers });
  assert.ok('skipped' in mapped, `expected ${item.name} to be left out`);
  return mapped.skipped;
};

describe('mapping a Saily plan', () => {
  test('a country plan carries exactly what the API says', () => {
    const plan = planOf(thailand20GB);
    assert.equal(plan.id, `saily-${thailand20GB.identifier}`);
    assert.equal(plan.providerId, 'saily');
    assert.equal(plan.planName, 'Thailand 20GB 30 days');
    assert.deepEqual(plan.coverage, { kind: 'country', countries: ['TH'], regionId: null, publishedDestinationCount: null });
    assert.equal(plan.dataAmountMb, 20 * 1024);
    assert.equal(plan.isUnlimited, false);
    assert.equal(plan.fairUsage, null);
    assert.equal(plan.validityDays, 30);
    assert.equal(plan.sourceCurrency, 'USD');
    assert.equal(plan.finalPriceMinor, 1999);
    assert.equal(plan.discount, null, 'no code until Saily confirm its terms in writing');
    assert.deepEqual(plan.networks, [], 'the API names no networks, so none are claimed');
    assert.equal(plan.hotspot, null);
  });

  test('the link is our tracking link carrying the plan’s own page, with the plan selected', () => {
    const plan = planOf(thailand20GB);
    const link = new URL(plan.affiliateUrl!);
    assert.equal(link.origin + link.pathname, 'https://go.saily.site/aff_c');
    assert.equal(link.searchParams.get('offer_id'), '101');
    assert.equal(link.searchParams.get('aff_id'), '17062');
    const destination = new URL(link.searchParams.get('url')!);
    assert.equal(destination.origin + destination.pathname, 'https://saily.com/esim-thailand');
    assert.equal(destination.searchParams.get('selectedPlan'), thailand20GB.identifier);
    // TUNE fills these in on the way; the click is credited by them.
    assert.equal(destination.searchParams.get('aff_transaction_id'), '{transaction_id}');
    assert.equal(destination.searchParams.get('aff_id'), '{aff_id}');
    assert.equal(plan.affiliateLandsOn, 'plan');
    assert.ok(buyLinkLandsOnPlan(plan), 'the plan-link rule keeps it');
  });

  test('an unlimited plan states its daily allowance and speed, as Saily’s page words them', () => {
    const plan = planOf(mexicoUnlimited);
    assert.equal(plan.isUnlimited, true);
    assert.equal(plan.dataAmountMb, 0);
    assert.deepEqual(plan.fairUsage, { thresholdMb: 3 * 1024, per: 'day', throttledToKbps: 1024 });
  });

  test('a regional plan keeps Saily’s own name for it; Europe is ours', () => {
    const asia = planOf(asiaOceania);
    assert.equal(asia.coverage.kind, 'region');
    assert.equal(asia.coverage.regionId, null);
    assert.equal(asia.coverage.regionName, 'Asia and Oceania');
    assert.ok(asia.coverage.countries.includes('TH') && asia.coverage.countries.includes('AU'));
    const europe = planOf(europe5GB);
    assert.equal(europe.coverage.regionId, 'europe');
    assert.equal(europe.coverage.regionName, undefined);
    assert.equal(planOf(global1GB).coverage.kind, 'global');
  });

  test('a plan its page does not sell is left out — Thailand unlimited for 7 days: US$28.99 in the API, another plan on saily.com', () => {
    const skipped = skipOf(thailandUnlimited7d);
    assert.equal(skipped.reason, 'not-offered');
    assert.match(skipped.detail, /esim-thailand/);
  });

  test('a plan its page sells at another price is left out, and the report says both prices', () => {
    const cheaper = new Map(offered).set(thailand20GB.identifier, 1499);
    const skipped = skipOf(thailand20GB, cheaper);
    assert.equal(skipped.reason, 'not-offered');
    assert.match(skipped.detail, /US\$19\.99 in the API, US\$14\.99 on saily\.com/);
  });

  test('Hawaii is not the United States: a page under a country is never the whole country', () => {
    assert.equal(skipOf(hawaii).reason, 'unknown-destination');
  });

  test('an "ultra" plan, which saily.com renews every billing cycle, is left out', () => {
    assert.equal(skipOf(globalUltra).reason, 'unsupported-plan-type');
  });

  test('a destination that is not that plan’s page on saily.com gives no link, and no plan', () => {
    const elsewhere = { ...thailand20GB, destination_url: encodeURIComponent('https://example.com/esim-thailand?selectedPlan=' + thailand20GB.identifier) };
    assert.equal(sailyPlanLink(elsewhere, '17062'), null);
    const otherPlan = { ...thailand20GB, destination_url: thailand20GB.destination_url.replace(thailand20GB.identifier, thailandUnlimited7d.identifier) };
    assert.equal(sailyPlanLink(otherPlan, '17062'), null);
    assert.equal(skipOf(otherPlan).reason, 'unknown-destination');
  });
});

describe('reading what a saily.com page sells', () => {
  test('every US-dollar offer, by the plan id the API uses', () => {
    const thailand = sailyOffersInPage(pages['https://saily.com/esim-thailand/']);
    assert.equal(thailand.get(thailand20GB.identifier), 1999);
    assert.equal(thailand.has(thailandUnlimited7d.identifier), false, 'the API plan its page does not sell');
    assert.ok([...thailand.values()].includes(2099), 'the unlimited 7-day plan the page sells instead, at US$20.99');
  });

  test('a page with no schema.org data sells nothing we can read', () => {
    assert.equal(sailyOffersInPage('<html><body>Just a moment...</body></html>').size, 0);
  });
});

describe('the Saily source', () => {
  const requests: string[] = [];
  const source = (overrides: Partial<Parameters<typeof sailySource>[0]> = {}) =>
    sailySource({
      affiliateId: '17062',
      fetchJson: async (url) => {
        requests.push(url);
        return { items: fixture, total: fixture.length };
      },
      offered,
      minPlans: 1,
      ...overrides,
    });

  test('lists the plans their pages sell, and reports the rest with the reason', async () => {
    const result = await source().fetch();
    assert.deepEqual(
      result.plans.map((plan) => plan.planName).sort(),
      ['Asia and Oceania UNLIMITED 10 days', 'Europe 5GB 30 days', 'Global 1GB 7 days', 'Mexico UNLIMITED 30 days', 'Thailand 20GB 30 days'],
    );
    assert.deepEqual(
      Object.fromEntries(result.skipped.map((entry) => [entry.label, entry.reason])),
      { 'Thailand UNLIMITED 7 days': 'not-offered', 'Hawaii 10GB 30 days': 'unknown-destination', 'Global 5GB 30 days': 'unsupported-plan-type' },
    );
  });

  test('reads only the API — never saily.com', async () => {
    requests.length = 0;
    await source().fetch();
    assert.deepEqual(requests, [SAILY_API]);
  });

  test('an answer that is not the plans list is a failed read', async () => {
    await assert.rejects(source({ fetchJson: async () => ({ error: 'nope' }) }).fetch(), /no list of items/);
  });

  test('the list in the code agrees with the pages read for the tests', () => {
    // Both are what saily.com sold on 9 October 2026.
    assert.equal(sailyOffered[thailand20GB.identifier], 1999);
    assert.equal(sailyOffered[thailandUnlimited7d.identifier], undefined);
    assert.ok(Object.keys(sailyOffered).length > 600);
  });
});

describe('Saily on the site', () => {
  test('only where our affiliate id is configured', () => {
    assert.equal(sailyAffiliateIdFromEnv({}), null);
    assert.equal(sailyAffiliateIdFromEnv({ SAILY_AFFILIATE_ID: ' 17062 ' }), '17062');
    assert.equal(sailyAffiliateIdFromEnv({ SAILY_AFFILIATE_ID: '17062&x=1' }), null);
    assert.deepEqual(planSourcesFromEnv({ SAILY_AFFILIATE_ID: '17062' }).map((s) => s.id), ['saily']);
    assert.deepEqual(planSourcesFromEnv({ DEMO_CATALOGUE: 'true' }).map((s) => s.id), ['mock']);
  });

  test('with its own logo, on the white tile', () => {
    const saily = getProvider('saily');
    assert.equal(saily?.name, 'Saily');
    assert.equal(saily?.logo?.src, '/providers/saily.svg');
    assert.equal(saily?.billingCurrency, 'not-confirmed');
  });
});
