import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildComparison } from '../src/lib/comparison/buildComparison';
import { provisionFactor, unlimitedPreferenceFactor } from '../src/lib/comparison/scorePlan';
import { estimateDataNeed } from '../src/lib/comparison/estimateDataNeed';
import { MB_PER_GB } from '../src/lib/formatters/data';

const japan = (usage: 'unlimited' | 'heavy' | 'regular' | 'hotspot') =>
  buildComparison({
    profile: { destinations: [{ countryCode: 'JP', days: 7 }], usage },
    currency: 'ILS',
  });

test('asking for unlimited does not return a 3GB plan first', () => {
  // This shipped: "best value" for a traveller who chose unlimited was a 3GB
  // plan covering 11% of the estimated need, because price carries more than
  // half the weight and the plan was the cheapest on the page.
  const { rows, recommendations } = japan('unlimited');
  assert.equal(rows[0].plan.isUnlimited, true, `top plan was ${rows[0].plan.planName}`);

  const best = rows.find((row) => row.plan.id === recommendations.bestValue?.planId);
  assert.equal(best?.plan.isUnlimited, true, 'best value must be an unlimited plan');
});

test('a plan that runs out mid-trip cannot be the best value', () => {
  for (const usage of ['unlimited', 'heavy', 'regular'] as const) {
    const { rows, recommendations } = japan(usage);
    const best = rows.find((row) => row.plan.id === recommendations.bestValue?.planId);
    assert.ok(best, usage);
    assert.equal(best.isBelowEstimatedNeed, false, `${usage}: recommended a plan below the need`);
  }
});

test('the under-provision penalty tolerates the imprecision of our own estimate', () => {
  const estimate = estimateDataNeed({
    destinations: [{ countryCode: 'JP', days: 7 }],
    usage: 'heavy',
  });
  const plan = (gb: number) =>
    ({ isUnlimited: false, dataAmountMb: gb * MB_PER_GB }) as never;

  // 10GB against a 10.3GB estimate is a match, not a failure.
  assert.equal(provisionFactor(plan(10), estimate), 1);
  // Half the data you need is not half a plan.
  assert.ok(provisionFactor(plan(5), estimate) < 0.4);
  // And a token allowance is discounted to the floor.
  assert.ok(provisionFactor(plan(1), estimate) <= 0.2);
});

test('a stated preference for unlimited is applied, not ignored', () => {
  const asked = estimateDataNeed({
    destinations: [{ countryCode: 'JP', days: 7 }],
    usage: 'unlimited',
  });
  const notAsked = estimateDataNeed({
    destinations: [{ countryCode: 'JP', days: 7 }],
    usage: 'regular',
  });
  const limited = { isUnlimited: false } as never;
  const unlimited = { isUnlimited: true } as never;

  assert.ok(unlimitedPreferenceFactor(limited, asked) < 1);
  assert.equal(unlimitedPreferenceFactor(unlimited, asked), 1);
  // And it changes nothing for a traveller who did not ask for it.
  assert.equal(unlimitedPreferenceFactor(limited, notAsked), 1);
});

test('a limited plan is still shown to someone who asked for unlimited', () => {
  // Preferring is not hiding: a large limited plan at a third of the price is
  // worth seeing, it just is not the answer.
  const { rows } = japan('unlimited');
  assert.ok(rows.some((row) => !row.plan.isUnlimited), 'limited plans disappeared');
});

test('a shortfall is ordered by how short it is, not by price', () => {
  // A 3GB plan and a 10GB plan against a 28GB need both hit the old floor of
  // 0.2, so price broke the tie and the 3GB plan ranked above the 10GB one.
  const { rows } = japan('hotspot');
  const short = rows.filter((row) => row.isBelowEstimatedNeed && !row.plan.isUnlimited);
  const sizes = short.map((row) => row.plan.dataAmountMb);
  assert.ok(sizes.length > 2, 'expected several short plans');
  assert.equal(Math.max(...sizes), sizes[0], 'the largest short plan should come first');
});

test('the shortfall warning and the ranking use the same threshold', () => {
  // The page must not warn "below your expected usage" on a plan it is
  // simultaneously recommending.
  for (const usage of ['unlimited', 'heavy', 'regular'] as const) {
    for (const row of japan(usage).rows) {
      assert.equal(
        row.isBelowEstimatedNeed,
        row.breakdown.provisionFactor < 1,
        `${usage}: ${row.plan.planName}`,
      );
    }
  }
});
