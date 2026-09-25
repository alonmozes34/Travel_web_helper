import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { alosimLink } from '@/data/alosim';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { applyPromotions } from '@/lib/pricing/promotions';
import { planPrice } from '@/lib/pricing/convert';
import { mockFxRates } from '@/data/fxRates';
import { dailyFullSpeedMb } from '@/lib/types/plan';
import {
  alosimCredentialsFromEnv,
  alosimLinkFor,
  alosimSource,
  ALOSIM_API_BASE,
  type AlosimFetch,
} from '@/lib/sources/alosim/alosimSource';
import { mapAlosimPlan } from '@/lib/sources/alosim/mapPlan';
import type { AlosimPlan } from '@/lib/sources/alosim/types';

// Seven plans exactly as aloSIM's API returned them on 25 September 2026,
// trimmed only in the length of the two multi-country location lists.
const fixture: AlosimPlan[] = JSON.parse(readFileSync(new URL('./fixtures/alosim-plans.json', import.meta.url), 'utf8'));
const [thai5gb, thaiUnlimited, europe, scandinavia, global, antilles, kosovo] = fixture;

const map = (item: AlosimPlan) => mapAlosimPlan(item, '2026-09-25T07:00:00.000Z', alosimLinkFor);
const planOf = (item: AlosimPlan) => {
  const mapped = map(item);
  assert.ok('plan' in mapped, `expected a plan for ${item.name}`);
  return mapped.plan;
};

describe('mapping an aloSIM plan', () => {
  test('a country plan carries exactly what the API says', () => {
    const plan = planOf(thai5gb);
    assert.equal(plan.providerId, 'alosim');
    assert.equal(plan.planName, 'Thailand 5GB 30 Days');
    assert.deepEqual(plan.coverage.countries, ['TH']);
    assert.equal(plan.coverage.kind, 'country');
    assert.equal(plan.dataAmountMb, 5 * 1024);
    assert.equal(plan.validityDays, 30);
    assert.equal(plan.sourceCurrency, 'USD');
    assert.equal(plan.finalPriceMinor, 800, '$8.00, checked by hand against their store');
    assert.equal(plan.source, 'api');
    assert.equal(plan.lastUpdatedAt, '2026-09-25T07:00:00.000Z');
  });

  test('what the API does not say is null, not "no"', () => {
    const plan = planOf(thai5gb);
    assert.equal(plan.hotspot, null);
    assert.equal(plan.calls, null);
    assert.equal(plan.sms, null);
    assert.equal(plan.topUp, null);
  });

  test('countries arrive as alpha-3 and leave as the alpha-2 the site uses', () => {
    assert.deepEqual(planOf(kosovo).coverage.countries, ['XK'], 'KSV is Kosovo, XK on the site');
    assert.ok(planOf(europe).coverage.countries.every((code) => /^[A-Z]{2}$/.test(code)));
  });

  test('an unlimited plan keeps its cap, without claiming it is per day', () => {
    const plan = planOf(thaiUnlimited);
    assert.equal(plan.isUnlimited, true);
    assert.equal(plan.dataAmountMb, 0);
    assert.deepEqual(plan.fairUsage, { thresholdMb: 3 * 1024, per: null, throttledToKbps: 1000 });
    // Scoring takes the less generous reading while the period is unknown.
    assert.equal(dailyFullSpeedMb(plan.fairUsage, plan.validityDays), (3 * 1024) / 7);
  });

  test('networks: LTE is 4G, 5G is 5G, and nothing is inferred', () => {
    const plan = planOf(thaiUnlimited);
    assert.ok(plan.networks.length > 0);
    for (const network of plan.networks) {
      assert.equal(network.countryCode, 'TH');
      assert.ok(network.technologies.length <= 1);
    }
  });

  test('regions: ours when the name means the same, theirs when it does not', () => {
    assert.equal(planOf(europe).coverage.kind, 'region');
    assert.equal(planOf(europe).coverage.regionId, 'europe');
    const nordic = planOf(scandinavia).coverage;
    assert.equal(nordic.regionId, null);
    assert.equal(nordic.regionName, 'Scandinavia');
    assert.equal(planOf(global).coverage.kind, 'global');
  });

  test('their own price in other currencies is kept, so euros are not our conversion', () => {
    const plan = planOf(thai5gb);
    assert.equal(plan.localPricesMinor?.EUR, thai5gb.prices.EUR);
    assert.equal(plan.localPricesMinor?.USD, undefined, 'the source currency is not repeated');
    assert.equal('MXN' in (plan.localPricesMinor ?? {}), false, 'a currency the site does not show is dropped');
    const inEuros = planPrice(plan, plan.finalPriceMinor, 'EUR', mockFxRates);
    assert.equal(inEuros.isConverted, false);
    assert.equal(inEuros.amountMinor, thai5gb.prices.EUR);
    const inShekels = planPrice(plan, plan.finalPriceMinor, 'ILS', mockFxRates);
    assert.equal(inShekels.isConverted, true, 'no shekel price from aloSIM, so this one is converted');
  });

  test('a place that no longer exists is skipped with the reason, not guessed at', () => {
    const mapped = map(antilles);
    assert.ok('skipped' in mapped);
    assert.equal(mapped.skipped.reason, 'unknown-destination');
  });

  test('records that cannot be read are skipped, never shown with a guess', () => {
    const cases: Array<[Partial<AlosimPlan>, string]> = [
      [{ price: 0 }, 'missing-price'],
      [{ dataGigabytes: 'lots' }, 'unparsable-allowance'],
      [{ validityDays: 0 }, 'unparsable-validity'],
      [{ currency: 'XYZ' }, 'unsupported-currency'],
      [{ locations: ['ZZZ'] }, 'unknown-destination'],
    ];
    for (const [change, reason] of cases) {
      const mapped = map({ ...thai5gb, ...change });
      assert.ok('skipped' in mapped, reason);
      assert.equal(mapped.skipped.reason, reason);
    }
  });
});

describe('the buy link', () => {
  test('a country plan goes through the Everflow tracking link, tagged with the destination', () => {
    const href = planOf(thai5gb).affiliateUrl!;
    const tracking = new URL(alosimLink('TH')!);
    const url = new URL(href);
    assert.equal(url.origin + url.pathname, tracking.origin + tracking.pathname);
    assert.equal(url.searchParams.get('affid'), '1810');
    assert.equal(url.searchParams.get('oid'), '9', 'the $5 offer aloSIM asked us to use');
    assert.equal(url.searchParams.get('source_id'), 'TH');
  });

  test('it says where it lands, so the button can say which plan to pick', () => {
    assert.equal(planOf(thai5gb).affiliateLandsOn, 'destination');
    assert.equal(planOf(global).affiliateLandsOn, 'plan', 'no tracking page, so their own plan link');
  });

  test('with LINK_TO_PLAN on, every button goes to the plan, still tagged', () => {
    const link = alosimLinkFor(thai5gb, ['TH'], { toPlan: true })!;
    const url = new URL(link.href);
    assert.equal(link.landsOn, 'plan');
    assert.equal(url.origin + url.pathname, 'https://alosim.com/thailand-esim');
    assert.ok(url.searchParams.get('plan_id'));
    assert.equal(url.searchParams.get('affid'), '1810');
    assert.equal(url.searchParams.get('oid'), '9');
    assert.equal(url.searchParams.get('source_id'), 'TH');
  });

  test('a bundle with a tracking page uses it; one without falls back to their own plan link', () => {
    assert.match(planOf(europe).affiliateUrl!, /^https:\/\/app\.alosim\.com\/esim-store\//);
    const globalUrl = new URL(planOf(global).affiliateUrl!);
    assert.equal(globalUrl.searchParams.get('affid'), '1810');
    assert.equal(globalUrl.searchParams.get('source_id'), 'global-esim');
  });
});

describe('the source', () => {
  function fakeApi(total = fixture.length) {
    const calls: string[] = [];
    const fetchJson: AlosimFetch = async (url, init) => {
      calls.push(`${init.method} ${url.replace(ALOSIM_API_BASE, '')}`);
      if (url.endsWith('/v1/authorize')) {
        assert.deepEqual(JSON.parse(init.body!), { clientId: 'id', clientSecret: 'secret' });
        return { access_token: 'token', token_type: 'Bearer', expires_in: 1 };
      }
      assert.equal(init.headers.Authorization, 'Bearer token');
      const offset = Number(new URL(url).searchParams.get('offset'));
      return { items: offset === 0 ? fixture : [], offset, total };
    };
    return { calls, fetchJson };
  }

  test('signs in, reads the plans, and reports what it skipped', async () => {
    const { calls, fetchJson } = fakeApi();
    const source = alosimSource({ credentials: { clientId: 'id', clientSecret: 'secret' }, fetchJson });
    const result = await source.fetch();
    assert.equal(calls[0], 'POST /v1/authorize');
    assert.match(calls[1], /^GET \/v1\/plans\?currency=USD&offset=0&count=2500$/);
    assert.equal(result.plans.length, fixture.length - 1);
    assert.equal(result.skipped.length, 1);
  });

  test('does not ask aloSIM again until the refresh interval has passed', async () => {
    const { calls, fetchJson } = fakeApi();
    let clock = 0;
    const source = alosimSource({ credentials: { clientId: 'id', clientSecret: 'secret' }, fetchJson, now: () => clock });
    await source.fetch();
    const after = calls.length;
    clock += 60 * 60 * 1000;
    await source.fetch();
    assert.equal(calls.length, after, 'an hour later, still cached');
    clock += 3 * 60 * 60 * 1000;
    await source.fetch();
    assert.ok(calls.length > after, 'past three hours, refreshed');
  });

  test('once it has a catalogue, an expired read does not wait for aloSIM', async () => {
    let clock = 0;
    let hang = false;
    const fetchJson: AlosimFetch = async (url) => {
      if (hang) return new Promise(() => {}); // aloSIM never answers
      if (url.endsWith('/v1/authorize')) return { access_token: 'token', token_type: 'Bearer' };
      return { items: fixture, offset: 0, total: fixture.length };
    };
    const source = alosimSource({ credentials: { clientId: 'id', clientSecret: 'secret' }, fetchJson, now: () => clock });
    const first = await source.fetch();
    hang = true;
    clock += 4 * 60 * 60 * 1000;
    const second = await source.fetch();
    assert.equal(second, first, 'the last catalogue, served at once');
  });

  test('a short read is a failure, not a smaller catalogue', async () => {
    const { fetchJson } = fakeApi(500);
    const source = alosimSource({ credentials: { clientId: 'id', clientSecret: 'secret' }, fetchJson });
    await assert.rejects(source.fetch(), /returned 7 of 500/);
  });

  test('credentials come from the environment, and both are needed', () => {
    assert.deepEqual(alosimCredentialsFromEnv({ ALOSIM_CLIENT_ID: ' a ', ALOSIM_CLIENT_SECRET: 'b' }), { clientId: 'a', clientSecret: 'b' });
    assert.equal(alosimCredentialsFromEnv({ ALOSIM_CLIENT_ID: 'a' }), null);
    assert.equal(alosimCredentialsFromEnv({}), null);
  });
});

describe('the YESHKLITA15 code on aloSIM plans', () => {
  const code = {
    providerId: 'alosim',
    code: 'YESHKLITA15',
    percent: 15,
    audience: 'newCustomers' as const,
    appliedByLink: false,
    validUntil: '2027-02-28',
    confirmedBy: 'test',
    confirmedOn: '2026-09-24',
  };

  test('is for new customers, so it rides beside the price and does not move the ranking', () => {
    const plans = [planOf(thai5gb), planOf(thaiUnlimited)];
    const [coded] = applyPromotions(plans, [code], '2026-09-25');
    assert.equal(coded.finalPriceMinor, 800);
    assert.equal(coded.discount?.code, 'YESHKLITA15');
    const comparison = buildComparison({
      profile: { destinations: [{ countryCode: 'TH', days: 10 }] },
      currency: 'USD',
      plans: applyPromotions(plans, [code], '2026-09-25'),
      rates: mockFxRates,
    });
    assert.equal(comparison.rows.find((row) => row.plan.id === coded.id)?.originalPrice, null);
  });

  test('is gone on 1 March 2027', () => {
    const [plan] = applyPromotions([planOf(thai5gb)], [code], '2027-03-01');
    assert.equal(plan.discount, null);
  });
});

describe('which catalogue is live', () => {
  test('real credentials win, and the demo is never mixed in with them', async () => {
    const { planSourcesFromEnv } = await import('@/lib/catalogue/getCatalogue');
    const both = planSourcesFromEnv({ ALOSIM_CLIENT_ID: 'a', ALOSIM_CLIENT_SECRET: 'b', DEMO_CATALOGUE: 'true' });
    assert.deepEqual(both.map((source) => source.id), ['alosim']);
    assert.deepEqual(planSourcesFromEnv({ DEMO_CATALOGUE: 'true' }).map((source) => source.id), ['mock']);
    assert.deepEqual(planSourcesFromEnv({}), [], 'with nothing configured there is nothing to show, not a demo');
  });
});
