import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import { mockPlans, getPlansForCountry } from '@/data/mockPlans';
import { mockFxRates } from '@/data/fxRates';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { DEFAULT_LEG_DAYS, DEFAULT_USAGE, estimateDataNeed } from '@/lib/comparison/estimateDataNeed';
import { headroomScore, needFitScore, scorePlans } from '@/lib/comparison/scorePlan';
import { convertPrice } from '@/lib/pricing/convert';
import { pricePerGbMinor, pricePerDayMinor } from '@/lib/pricing/perUnit';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Plan } from '@/lib/types/plan';

function plan(overrides: Partial<Plan> & { id: string }): Plan {
  return {
    providerId: 'test',
    planName: 'Test plan',
    coverage: { kind: 'country', countries: ['TH'], regionId: null, publishedDestinationCount: null },
    dataAmountMb: 10 * MB_PER_GB,
    isUnlimited: false,
    fairUsage: null,
    validityDays: 30,
    sourceCurrency: 'ILS',
    originalPriceMinor: 6000,
    finalPriceMinor: 6000,
    discount: null,
    networks: [],
    hotspot: false,
    calls: false,
    sms: false,
    topUp: false,
    affiliateUrl: null,
    source: 'mock',
    lastUpdatedAt: null,
    ...overrides,
  };
}

describe('estimateDataNeed', () => {
  test('falls back to a neutral profile and says so', () => {
    const estimate = estimateDataNeed({ destinations: [] });
    assert.equal(estimate.days, DEFAULT_LEG_DAYS);
    assert.equal(estimate.usage, DEFAULT_USAGE);
    assert.equal(estimate.isDefault, true);
  });

  test('scales with days and usage', () => {
    const light = estimateDataNeed({ destinations: [{ countryCode: 'TH', days: 10 }], usage: 'light' });
    const heavy = estimateDataNeed({ destinations: [{ countryCode: 'TH', days: 10 }], usage: 'heavy' });
    assert.equal(light.requiredMb, 2500);
    assert.ok(heavy.requiredMb > light.requiredMb);
    assert.equal(heavy.isDefault, false);
  });
});

describe('scoring components', () => {
  const estimate = estimateDataNeed({ destinations: [{ countryCode: 'TH', days: 10 }], usage: 'regular' }); // 6000MB

  test('falling short of the need is penalised more than proportionally', () => {
    const half = needFitScore(plan({ id: 'a', dataAmountMb: 3000 }), estimate);
    assert.ok(half < 0.5, `expected a steep penalty, got ${half}`);
  });

  test('meeting the need scores full marks, and unlimited counts as met', () => {
    assert.equal(needFitScore(plan({ id: 'b', dataAmountMb: 6000 }), estimate), 1);
    assert.equal(
      needFitScore(plan({ id: 'c', isUnlimited: true, dataAmountMb: 0 }), estimate),
      1,
    );
  });

  test('extra data has diminishing returns', () => {
    const oneExtra = headroomScore(plan({ id: 'd', dataAmountMb: 12000 }), estimate);
    const fourExtra = headroomScore(plan({ id: 'e', dataAmountMb: 30000 }), estimate);
    assert.ok(oneExtra > 0.5);
    assert.ok(fourExtra < oneExtra * 1.7, 'four times the extra data must not be worth four times as much');
  });
});

describe('best value', () => {
  // The worked example from the approved brief. Need is 10GB.
  const estimate = estimateDataNeed({ destinations: [{ countryCode: 'TH', days: 10 }], usage: 'light' }); // 2500MB
  const need10Gb = { ...estimate, requiredMb: 10 * MB_PER_GB, requiredGb: 10, dailyMb: 1024 };

  const a = plan({ id: 'a', dataAmountMb: 10 * MB_PER_GB, finalPriceMinor: 6000 });
  const b = plan({ id: 'b', dataAmountMb: 20 * MB_PER_GB, finalPriceMinor: 6200 });
  const c = plan({ id: 'c', dataAmountMb: 50 * MB_PER_GB, finalPriceMinor: 9000 });

  const prices = new Map([
    ['a', 6000],
    ['b', 6200],
    ['c', 9000],
  ]);

  test('cheap extra data wins, expensive unused data does not', () => {
    const ranked = scorePlans([a, b, c], { estimate: need10Gb, priceByPlanId: prices });
    assert.deepEqual(
      ranked.map((entry) => entry.plan.id),
      ['b', 'a', 'c'],
    );
  });

  test('the lowest price per GB does not win on its own', () => {
    const perGb = (p: Plan, price: number) => pricePerGbMinor(p, price)!;
    assert.ok(perGb(c, 9000) < perGb(b, 6200), 'plan C really does have the best price per GB');

    const ranked = scorePlans([a, b, c], { estimate: need10Gb, priceByPlanId: prices });
    assert.notEqual(ranked[0].plan.id, 'c');
  });

  test('extra data stops being worth it once it costs real money', () => {
    const expensiveB = plan({ id: 'b', dataAmountMb: 20 * MB_PER_GB, finalPriceMinor: 8500 });
    const ranked = scorePlans([a, expensiveB, c], {
      estimate: need10Gb,
      priceByPlanId: new Map([
        ['a', 6000],
        ['b', 8500],
        ['c', 9000],
      ]),
    });
    assert.equal(ranked[0].plan.id, 'a');
  });

  test('one expensive outlier does not flatten the differences beneath it', () => {
    const outlier = plan({ id: 'outlier', isUnlimited: true, dataAmountMb: 0, finalPriceMinor: 20700 });
    const ranked = scorePlans([a, b, c, outlier], {
      estimate: need10Gb,
      priceByPlanId: new Map([
        ['a', 6000],
        ['b', 6200],
        ['c', 9000],
        ['outlier', 20700],
      ]),
    });
    assert.deepEqual(
      ranked.filter((entry) => entry.plan.id !== 'outlier').map((entry) => entry.plan.id),
      ['b', 'a', 'c'],
      'adding a much dearer plan must not reorder the others',
    );
  });

  test('a plan that expires before the trip ends is pushed to the bottom', () => {
    const shortValidity = plan({
      id: 'short',
      dataAmountMb: 20 * MB_PER_GB,
      finalPriceMinor: 3000,
      validityDays: 5,
    });
    const ranked = scorePlans([a, shortValidity], {
      estimate: need10Gb,
      priceByPlanId: new Map([
        ['a', 6000],
        ['short', 3000],
      ]),
    });
    assert.equal(ranked[0].plan.id, 'a', 'the cheaper plan must not win when it expires mid-trip');
    assert.equal(ranked.find((entry) => entry.plan.id === 'short')!.coversTrip, false);
  });
});

describe('currency conversion', () => {
  test('same currency is not marked as converted', () => {
    const price = convertPrice(5900, 'ILS', 'ILS', mockFxRates);
    assert.equal(price.isConverted, false);
    assert.equal(price.amountMinor, 5900);
  });

  test('conversion keeps the source amount, the rate and its date', () => {
    const price = convertPrice(1820, 'USD', 'ILS', mockFxRates);
    assert.equal(price.isConverted, true);
    assert.equal(price.currency, 'ILS');
    assert.equal(price.sourceCurrency, 'USD');
    assert.equal(price.sourceAmountMinor, 1820);
    // Taken from the table rather than hard-coded: the mock rates are now
    // crossed through the euro by the same function the live feed uses, so a
    // magic number here would be a second copy of the arithmetic.
    const usdIls = mockFxRates.find((rate) => rate.from === 'USD' && rate.to === 'ILS');
    assert.ok(usdIls, 'the mock table no longer carries USD to ILS');
    assert.equal(price.amountMinor, Math.round(1820 * usdIls.rate));
    assert.ok(Math.abs(usdIls.rate - 3.24) < 0.05, `USD to ILS looks wrong: ${usdIls.rate}`);
    assert.ok(price.fxAsOf);
    assert.equal(price.fxSource, 'mock');
  });

  test('an unknown rate returns the source price rather than a guess', () => {
    const price = convertPrice(1000, 'USD', 'ILS', []);
    assert.equal(price.isConverted, false);
    assert.equal(price.currency, 'USD');
  });
});

describe('per-unit pricing', () => {
  test('price per GB is meaningless for unlimited plans', () => {
    assert.equal(pricePerGbMinor(plan({ id: 'u', isUnlimited: true, dataAmountMb: 0 }), 20700), null);
  });

  test('price per GB and per day', () => {
    assert.equal(pricePerGbMinor(plan({ id: 'p', dataAmountMb: 20 * MB_PER_GB }), 5900), 295);
    assert.equal(pricePerDayMinor(20700, 15), 1380);
  });
});

describe('recommendations', () => {
  const comparison = buildComparison({
    currency: 'ILS',
    profile: { destinations: [{ countryCode: 'TH', days: 14 }], usage: 'regular' },
  });

  test('every category points at a plan that exists', () => {
    for (const recommendation of Object.values(comparison.recommendations)) {
      assert.ok(
        comparison.rows.some((row) => row.plan.id === recommendation.planId),
        `${recommendation.key} points at a missing plan`,
      );
    }
  });

  test('the cheapest recommendation lasts the whole trip', () => {
    const cheapest = comparison.recommendations.cheapest;
    assert.ok(cheapest);
    const row = comparison.rows.find((entry) => entry.plan.id === cheapest.planId)!;
    assert.ok(row.plan.validityDays >= 14);
  });

  test('a category with no qualifying plan is omitted, not substituted', () => {
    const noUnlimited = buildComparison({
      currency: 'ILS',
      profile: { destinations: [{ countryCode: 'TH' }] },
      plans: getPlansForCountry('TH').filter((entry) => !entry.isUnlimited),
    });
    assert.equal(noUnlimited.recommendations.bestUnlimited, undefined);
    assert.ok(noUnlimited.recommendations.bestValue);
  });

  test('counts are derived from the data', () => {
    assert.equal(comparison.planCount, getPlansForCountry('TH').length);
    assert.equal(
      comparison.providerCount,
      new Set(getPlansForCountry('TH').map((entry) => entry.providerId)).size,
    );
  });
});

describe('mock data is unmistakably mock', () => {
  test('every plan is marked as mock and has no affiliate link', () => {
    for (const entry of mockPlans) {
      assert.equal(entry.source, 'mock', `${entry.id} is not marked as mock`);
      assert.equal(entry.affiliateUrl, null, `${entry.id} has an affiliate URL`);
      assert.equal(entry.lastUpdatedAt, null, `${entry.id} claims a freshness timestamp`);
    }
  });

  test('every discount is marked as mock', () => {
    for (const entry of mockPlans) {
      if (entry.discount) assert.equal(entry.discount.source, 'mock', `${entry.id} discount`);
    }
  });

  test('no coverage rating is published without a source', () => {
    for (const entry of mockPlans) {
      for (const network of entry.networks) {
        if (network.coverage) assert.ok(network.coverage.source, `${entry.id} coverage`);
      }
    }
  });

  test('the plan model carries nothing that could rank by commission', () => {
    const forbidden = ['commission', 'payout', 'epc', 'manualRank', 'rank'];
    for (const entry of mockPlans) {
      for (const key of Object.keys(entry)) {
        assert.ok(!forbidden.includes(key), `${entry.id} exposes ${key}`);
      }
    }
  });
});

describe('the unlimited category ranks on the trip, not on surplus validity', () => {
  const trip = { destinations: [{ countryCode: 'TH', days: 5 }], usage: 'regular' as const };

  // The shape reported on France: two unlimited plans, identical fair usage,
  // both outlasting the trip several times over, one £71 dearer and valid for
  // longer. Ranking by price per day of validity crowned the dearer one.
  const cheaperShorter = plan({
    id: 'cheaper-10d',
    planName: 'Cheaper, 10 days',
    isUnlimited: true,
    dataAmountMb: 0,
    validityDays: 10,
    finalPriceMinor: 15228,
    originalPriceMinor: 15228,
    fairUsage: { dailyThresholdMb: 5 * MB_PER_GB, throttledToKbps: 512 },
  });
  const dearerLonger = plan({
    id: 'dearer-15d',
    planName: 'Dearer, 15 days',
    isUnlimited: true,
    dataAmountMb: 0,
    validityDays: 15,
    finalPriceMinor: 22356,
    originalPriceMinor: 22356,
    fairUsage: { dailyThresholdMb: 5 * MB_PER_GB, throttledToKbps: 512 },
  });

  test('the cheaper plan wins when both outlast the trip', () => {
    const comparison = buildComparison({
      profile: trip,
      currency: 'ILS',
      plans: [cheaperShorter, dearerLonger],
      rates: mockFxRates,
    });
    assert.equal(comparison.recommendations.bestUnlimited?.planId, 'cheaper-10d');
  });

  test('a stricter fair-usage policy still counts against a plan', () => {
    const throttled = plan({
      ...cheaperShorter,
      id: 'cheaper-throttled',
      // Well under the 600MB a day this trip is estimated at.
      fairUsage: { dailyThresholdMb: 100, throttledToKbps: 256 },
    });
    const comparison = buildComparison({
      profile: trip,
      currency: 'ILS',
      plans: [throttled, dearerLonger],
      rates: mockFxRates,
    });
    // 152.28 / 0.667 = 228 against 223.56 at full marks: the dearer plan wins
    // on the data it actually delivers, which is the one adjustment left.
    assert.equal(comparison.recommendations.bestUnlimited?.planId, 'dearer-15d');
  });

  test('the ranking figure is on the row, so the tab and the badge agree', () => {
    const comparison = buildComparison({
      profile: trip,
      currency: 'ILS',
      plans: [dearerLonger, cheaperShorter],
      rates: mockFxRates,
    });
    const byCost = [...comparison.rows].sort(
      (a, b) => (a.unlimitedCostMinor ?? Infinity) - (b.unlimitedCostMinor ?? Infinity),
    );
    assert.equal(byCost[0].plan.id, comparison.recommendations.bestUnlimited?.planId);
    assert.equal(
      comparison.rows.find((row) => !row.plan.isUnlimited)?.unlimitedCostMinor ?? null,
      null,
    );
  });
});

describe('the browsing category breaks ties on price', () => {
  test('two plans with the same published facts are ordered by what they cost', () => {
    const facts = {
      isUnlimited: false,
      dataAmountMb: 10 * MB_PER_GB,
      validityDays: 30,
      networks: [
        {
          countryCode: 'TH',
          operator: 'AIS',
          mccMnc: null,
          technologies: ['4G', '5G'],
          coverage: null,
        },
      ] as Plan['networks'],
      hotspot: true,
    };
    const dearer = plan({ ...facts, id: 'dearer', finalPriceMinor: 9000, originalPriceMinor: 9000 });
    const cheaper = plan({ ...facts, id: 'cheaper', finalPriceMinor: 5000, originalPriceMinor: 5000 });

    const comparison = buildComparison({
      profile: { destinations: [{ countryCode: 'TH', days: 5 }], usage: 'regular' },
      currency: 'ILS',
      plans: [dearer, cheaper],
      rates: mockFxRates,
    });
    const scores = comparison.rows.map((row) => row.browsingScore);
    assert.equal(scores[0], scores[1], 'the two plans should tie on browsing');
    assert.equal(comparison.recommendations.bestForBrowsing?.planId, 'cheaper');
  });
});

describe('a page that mixes a real provider with the demo catalogue', () => {
  const trip = { destinations: [{ countryCode: 'TH', days: 5 }], usage: 'regular' as const };
  const demo = plan({ id: 'demo', planName: 'Demo plan', source: 'mock' });
  const real = plan({ id: 'real', planName: 'Real plan', source: 'api', finalPriceMinor: 7000 });

  const build = (plans: Plan[]) =>
    buildComparison({ profile: trip, currency: 'ILS', plans, rates: mockFxRates });

  test('everything demo: the page may say so about every price', () => {
    const c = build([demo]);
    assert.equal(c.isMockData, true);
    assert.equal(c.allMockData, true);
  });

  test('mixed: the warning still shows, but not as a claim about every price', () => {
    // The case this exists for. "The prices here are not real" would be false
    // about the real one, and would throw away the first real figure we get.
    const c = build([demo, real]);
    assert.equal(c.isMockData, true);
    assert.equal(c.allMockData, false);
  });

  test('all real: no warning at all', () => {
    const c = build([real]);
    assert.equal(c.isMockData, false);
    assert.equal(c.allMockData, false);
  });

  test('an empty page is not described as fully demo', () => {
    // `every` on an empty array is true, which would have claimed a page with
    // no plans on it was entirely invented.
    const c = build([]);
    assert.equal(c.isMockData, false);
    assert.equal(c.allMockData, false);
  });

  test('the row carries its own source, so the marker can be per row', () => {
    const c = build([demo, real]);
    const sources = Object.fromEntries(c.rows.map((row) => [row.plan.id, row.plan.source]));
    assert.deepEqual(sources, { demo: 'mock', real: 'api' });
  });
});
