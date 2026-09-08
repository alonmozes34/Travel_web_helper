import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getPlansCoveringAll, getPlansForCountry, mockPlans } from '@/data/mockPlans';
import { getRegion } from '@/data/regions';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { buildCombination } from '@/lib/comparison/buildCombination';
import { estimateDataNeed } from '@/lib/comparison/estimateDataNeed';
import { mockFxRates } from '@/data/fxRates';
import { coversAll } from '@/lib/types/coverage';
import type { TripProfile } from '@/lib/types/trip';

const germanyThenUsa: TripProfile = {
  destinations: [
    { countryCode: 'DE', days: 1 },
    { countryCode: 'US', days: 14 },
  ],
  usage: 'regular',
};

describe('coverage', () => {
  test('a country page lists regional and global plans too', () => {
    const french = getPlansForCountry('FR');
    assert.ok(french.some((plan) => plan.coverage.kind === 'country'));
    assert.ok(french.some((plan) => plan.coverage.kind === 'region'), 'no regional plan for France');
    assert.ok(french.some((plan) => plan.coverage.kind === 'global'), 'no global plan for France');
  });

  test('matching uses the verified country list, never the provider’s claim', () => {
    for (const plan of mockPlans) {
      if (plan.coverage.publishedDestinationCount === null) continue;
      assert.ok(
        plan.coverage.countries.length <= plan.coverage.publishedDestinationCount,
        `${plan.id} claims fewer destinations than it lists`,
      );
      assert.ok(plan.coverage.countries.length > 0, `${plan.id} has a claim but no verified list`);
    }
  });

  test('a European plan does not cover the United States', () => {
    const europe = getRegion('europe')!;
    assert.ok(!europe.countries.includes('US'));
    const eurolink = mockPlans.find((plan) => plan.planName === 'Eurolink 10GB')!;
    assert.equal(coversAll(eurolink.coverage, ['DE', 'US']), false);
    assert.equal(coversAll(eurolink.coverage, ['DE', 'FR']), true);
  });

  test('only plans covering every stop appear in the results', () => {
    const comparison = buildComparison({ profile: germanyThenUsa, currency: 'ILS' });
    assert.ok(comparison.rows.length > 0);
    for (const row of comparison.rows) {
      assert.ok(coversAll(row.plan.coverage, ['DE', 'US']), `${row.plan.id} does not cover both stops`);
    }
    assert.equal(
      comparison.rows.length,
      getPlansCoveringAll(['DE', 'US']).length,
      'a plan covering both stops was dropped',
    );
  });
});

describe('combinations', () => {
  test('a single-destination search has no combination', () => {
    const comparison = buildComparison({
      profile: { destinations: [{ countryCode: 'TH', days: 14 }] },
      currency: 'ILS',
    });
    assert.equal(comparison.combination, null);
  });

  test('two local plans beat the cheapest plan covering the whole trip', () => {
    const comparison = buildComparison({ profile: germanyThenUsa, currency: 'ILS' });
    const combination = comparison.combination;
    assert.ok(combination, 'no combination was offered');

    const cheapestSingle = Math.min(...comparison.rows.map((row) => row.price.amountMinor));
    assert.ok(
      combination.totalMinor < cheapestSingle,
      `combination ${combination.totalMinor} is not cheaper than ${cheapestSingle}`,
    );
  });

  test('every stop is covered exactly once', () => {
    const combination = buildComparison({ profile: germanyThenUsa, currency: 'ILS' }).combination!;
    const covered = combination.legs.flatMap((leg) => leg.countryCodes);
    assert.deepEqual([...covered].sort(), ['DE', 'US']);
    assert.equal(new Set(covered).size, covered.length, 'a stop was bought for twice');
  });

  test('the total is the sum of the legs', () => {
    const combination = buildComparison({ profile: germanyThenUsa, currency: 'ILS' }).combination!;
    assert.equal(
      combination.totalMinor,
      combination.legs.reduce((sum, leg) => sum + leg.priceMinor, 0),
    );
  });

  test('a one-night stop is not sold a fortnight of data', () => {
    const combination = buildComparison({ profile: germanyThenUsa, currency: 'ILS' }).combination!;
    const german = combination.legs.find((leg) => leg.countryCodes.includes('DE'))!;
    const american = combination.legs.find((leg) => leg.countryCodes.includes('US'))!;
    assert.ok(
      german.plan.dataAmountMb < american.plan.dataAmountMb,
      'the one-night leg was given as much data as the fortnight',
    );
  });

  test('one plan covering both stops is not dressed up as a combination', () => {
    const globalOnly = mockPlans.filter((plan) => plan.coverage.kind === 'global');
    const combination = buildCombination({
      profile: germanyThenUsa,
      plans: globalOnly,
      currency: 'ILS',
      rates: mockFxRates,
    });
    assert.equal(combination, null);
  });

  test('a destination with no plan at all yields no combination', () => {
    const combination = buildCombination({
      profile: { destinations: [{ countryCode: 'DE' }, { countryCode: 'ZZ' }] },
      plans: mockPlans,
      currency: 'ILS',
      rates: mockFxRates,
    });
    assert.equal(combination, null);
  });
});

describe('per-stop estimates', () => {
  test('each stop is estimated on its own days', () => {
    const estimate = estimateDataNeed(germanyThenUsa);
    const [germany, usa] = estimate.legs;
    assert.equal(germany.days, 1);
    assert.equal(usa.days, 14);
    assert.equal(estimate.days, 15);
    assert.equal(estimate.requiredMb, germany.requiredMb + usa.requiredMb);
    assert.ok(usa.requiredMb > germany.requiredMb * 10);
  });

  test('a stop without a length is marked as assumed', () => {
    const estimate = estimateDataNeed({ destinations: [{ countryCode: 'DE' }] });
    assert.equal(estimate.legs[0].isAssumedLength, true);
  });
});
