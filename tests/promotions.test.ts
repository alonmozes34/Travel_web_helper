import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { promotions, type Promotion } from '@/data/promotions';
import { mockRateSource } from '@/lib/sources/mockPlanSource';
import { sourceResult, type ProviderSource } from '@/lib/sources/ProviderSource';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { catalogueLoader } from '@/lib/catalogue/getCatalogue';
import { MB_PER_GB } from '@/lib/formatters/data';
import { applyPromotions, isPromotionActive } from '@/lib/pricing/promotions';
import { hasDiscount, type Plan } from '@/lib/types/plan';

function plan(overrides: Partial<Plan> & { id: string }): Plan {
  return {
    providerId: 'coded',
    planName: 'Thailand 10GB 30 Days',
    coverage: { kind: 'country', countries: ['TH'], regionId: null, publishedDestinationCount: null },
    dataAmountMb: 10 * MB_PER_GB,
    isUnlimited: false,
    fairUsage: null,
    validityDays: 30,
    sourceCurrency: 'USD',
    originalPriceMinor: 2000,
    finalPriceMinor: 2000,
    discount: null,
    networks: [],
    hotspot: true,
    calls: false,
    sms: false,
    topUp: false,
    affiliateUrl: null,
    source: 'api',
    lastUpdatedAt: '2026-09-24T07:00:00Z',
    ...overrides,
  };
}

function promotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    providerId: 'coded',
    code: 'YESH15',
    percent: 15,
    audience: 'everyone',
    appliedByLink: false,
    validUntil: null,
    confirmedBy: 'test fixture',
    confirmedOn: '2026-09-24',
    ...overrides,
  };
}

const TODAY = '2026-09-24';

describe('applyPromotions', () => {
  test('a code for everyone lowers the price and keeps the old one to strike through', () => {
    const [result] = applyPromotions([plan({ id: 'a' })], [promotion()], TODAY);
    assert.equal(result.originalPriceMinor, 2000);
    assert.equal(result.finalPriceMinor, 1700);
    assert.equal(result.discount?.code, 'YESH15');
    assert.equal(result.discount?.source, 'affiliate');
    assert.equal(result.discount?.audience, 'everyone');
    assert.ok(hasDiscount(result));
  });

  test('a code for new customers only leaves the price alone', () => {
    const [result] = applyPromotions([plan({ id: 'a' })], [promotion({ audience: 'newCustomers' })], TODAY);
    assert.equal(result.finalPriceMinor, 2000, 'a returning customer must not be promised the lower price');
    assert.equal(result.originalPriceMinor, 2000);
    assert.equal(result.discount?.audience, 'newCustomers');
    assert.equal(hasDiscount(result), false, 'no struck-through price for a discount most people cannot get');
  });

  test('only the provider that issued the code is touched', () => {
    const [other] = applyPromotions([plan({ id: 'b', providerId: 'someone-else' })], [promotion()], TODAY);
    assert.equal(other.finalPriceMinor, 2000);
    assert.equal(other.discount, null);
  });

  test('demo plans never carry a real code', () => {
    const [demo] = applyPromotions([plan({ id: 'd', source: 'mock' })], [promotion()], TODAY);
    assert.equal(demo.finalPriceMinor, 2000);
    assert.equal(demo.discount, null);
  });

  test('a plan already on sale is not given a stacked price nobody confirmed', () => {
    const onSale = plan({ id: 's', originalPriceMinor: 2500, finalPriceMinor: 2000 });
    const [result] = applyPromotions([onSale], [promotion()], TODAY);
    assert.deepEqual(result, onSale);
  });

  test('an expired code drops off by itself, and the last day still counts', () => {
    const code = promotion({ validUntil: '2026-09-30' });
    assert.equal(isPromotionActive(code, '2026-09-30'), true);
    assert.equal(isPromotionActive(code, '2026-10-01'), false);
    const [after] = applyPromotions([plan({ id: 'a' })], [code], '2026-10-01');
    assert.equal(after.finalPriceMinor, 2000);
    assert.equal(after.discount, null);
  });

  test('rounds to the nearest minor unit', () => {
    const [result] = applyPromotions([plan({ id: 'a', originalPriceMinor: 450, finalPriceMinor: 450 })], [promotion()], TODAY);
    assert.equal(result.finalPriceMinor, 383); // 4.50 × 0.85 = 3.825
  });
});

describe('ranking', () => {
  test('a code for everyone ranks on the price the visitor actually pays', () => {
    const coded = plan({ id: 'coded-plan', finalPriceMinor: 2000, originalPriceMinor: 2000 });
    const rival = plan({ id: 'rival-plan', providerId: 'rival', finalPriceMinor: 1800, originalPriceMinor: 1800 });
    const profile = { destinations: [{ countryCode: 'TH', days: 10 }] };

    const before = buildComparison({ profile, currency: 'USD', plans: [coded, rival] });
    assert.equal(before.recommendations.cheapest?.planId, 'rival-plan');

    const after = buildComparison({
      profile,
      currency: 'USD',
      plans: applyPromotions([coded, rival], [promotion()], TODAY),
    });
    assert.equal(after.recommendations.cheapest?.planId, 'coded-plan', '17.00 after the code beats 18.00');
  });

  test('a code for new customers does not move the ranking', () => {
    const coded = plan({ id: 'coded-plan', finalPriceMinor: 2000, originalPriceMinor: 2000 });
    const rival = plan({ id: 'rival-plan', providerId: 'rival', finalPriceMinor: 1800, originalPriceMinor: 1800 });
    const profile = { destinations: [{ countryCode: 'TH', days: 10 }] };
    const after = buildComparison({
      profile,
      currency: 'USD',
      plans: applyPromotions([coded, rival], [promotion({ audience: 'newCustomers' })], TODAY),
    });
    assert.equal(after.recommendations.cheapest?.planId, 'rival-plan');
  });
});

describe('the catalogue', () => {
  test('applies codes on the way out, and stops the day they expire', async () => {
    const source: ProviderSource = {
      id: 'coded',
      label: 'Coded',
      fetch: async () => sourceResult('coded', [plan({ id: 'a' })], [], '2026-09-24T07:00:00Z'),
    };
    let clock = Date.parse('2026-09-30T23:59:50Z');
    const loader = catalogueLoader(
      { plans: [source], rates: [mockRateSource()] },
      () => clock,
      [promotion({ validUntil: '2026-09-30' })],
    );
    assert.equal((await loader.get()).plans[0].finalPriceMinor, 1700);

    // Twenty seconds later, inside the cache's lifetime, and past midnight:
    // the code is gone although the plans were not refetched.
    clock = Date.parse('2026-10-01T00:00:10Z');
    assert.equal((await loader.get()).plans[0].finalPriceMinor, 2000);
  });
});

describe('the confirmed promotions', () => {
  test('every record says who confirmed it and when, and is internally sane', () => {
    for (const record of promotions) {
      assert.ok(record.confirmedBy.trim().length > 0, `${record.providerId}: who confirmed the terms?`);
      assert.match(record.confirmedOn, /^\d{4}-\d{2}-\d{2}$/);
      if (record.validUntil !== null) assert.match(record.validUntil, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(Number.isInteger(record.percent) && record.percent >= 1 && record.percent <= 99);
      assert.ok(record.code.trim().length > 0);
    }
  });

  test('one code per provider, or which one applies would be an accident of order', () => {
    const ids = promotions.map((record) => record.providerId);
    assert.equal(new Set(ids).size, ids.length);
  });
});
