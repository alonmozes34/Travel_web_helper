import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isTripDescribed,
  missingTripFields,
  parseRequestedGb,
  tripProfileFromParams,
  tripProfileToQuery,
} from '../src/lib/types/trip';
import { estimateDataNeed, dailyDataMbByUsage } from '../src/lib/comparison/estimateDataNeed';
import { MB_PER_GB } from '../src/lib/formatters/data';

test('a trip is described only once the days and the usage are both known', () => {
  assert.equal(isTripDescribed({ destinations: [] }), false);
  assert.equal(isTripDescribed({ destinations: [{ countryCode: 'TH' }] }), false);
  assert.equal(isTripDescribed({ destinations: [{ countryCode: 'TH', days: 10 }] }), false);
  assert.equal(
    isTripDescribed({ destinations: [{ countryCode: 'TH', days: 10 }], usage: 'regular' }),
    true,
  );
  // A stated GB figure answers the same question as picking a usage.
  assert.equal(
    isTripDescribed({ destinations: [{ countryCode: 'TH', days: 10 }], requestedGb: 50 }),
    true,
  );
  // Every stop needs its own length, not just the first.
  assert.equal(
    isTripDescribed({
      destinations: [{ countryCode: 'DE', days: 2 }, { countryCode: 'US' }],
      usage: 'regular',
    }),
    false,
  );
});

test('the form is told which answer is missing', () => {
  assert.deepEqual(missingTripFields({ destinations: [] }), ['destination', 'usage']);
  assert.deepEqual(missingTripFields({ destinations: [{ countryCode: 'TH' }] }), ['days', 'usage']);
  assert.deepEqual(
    missingTripFields({ destinations: [{ countryCode: 'TH', days: 5 }] }),
    ['usage'],
  );
  assert.deepEqual(
    missingTripFields({ destinations: [{ countryCode: 'TH', days: 5 }], usage: 'heavy' }),
    [],
  );
});

test('the usage scale spans navigation to tethering', () => {
  // The reason the scale exists: one number in the middle serves neither end.
  assert.ok(dailyDataMbByUsage.hotspot >= dailyDataMbByUsage.navigation * 20);
  assert.ok(dailyDataMbByUsage.navigation < dailyDataMbByUsage.light);
  assert.ok(dailyDataMbByUsage.heavy < dailyDataMbByUsage.hotspot);
});

test('a stated GB figure replaces the usage estimate rather than adding to it', () => {
  const stated = estimateDataNeed({
    destinations: [{ countryCode: 'TH', days: 10 }],
    requestedGb: 100,
  });
  assert.equal(stated.isStatedByTraveller, true);
  assert.equal(stated.requiredMb, 100 * MB_PER_GB);
  assert.equal(stated.requiredGb, 100);

  // And it is not quietly blended with the default usage.
  const guessed = estimateDataNeed({
    destinations: [{ countryCode: 'TH', days: 10 }],
    usage: 'regular',
  });
  assert.equal(guessed.isStatedByTraveller, false);
  assert.equal(guessed.requiredMb, 10 * dailyDataMbByUsage.regular);
});

test('a stated figure is spread across stops in proportion to their length', () => {
  const estimate = estimateDataNeed({
    destinations: [
      { countryCode: 'DE', days: 1 },
      { countryCode: 'US', days: 9 },
    ],
    requestedGb: 20,
  });
  const [germany, states] = estimate.legs;
  assert.equal(estimate.requiredGb, 20);
  assert.equal(Math.round(germany.requiredGb), 2);
  assert.equal(Math.round(states.requiredGb), 18);
});

test('a tethering trip needs far more data than a navigation trip', () => {
  const days = [{ countryCode: 'TH', days: 14 }];
  const navigating = estimateDataNeed({ destinations: days, usage: 'navigation' });
  const tethering = estimateDataNeed({ destinations: days, usage: 'hotspot' });
  assert.ok(tethering.requiredGb > navigating.requiredGb * 20);
  assert.ok(navigating.requiredGb < 3, 'navigation for a fortnight is a couple of GB');
  assert.ok(tethering.requiredGb > 50, 'tethering for a fortnight is tens of GB');
});

test('the GB figure survives a round trip through the URL', () => {
  const profile = {
    destinations: [{ countryCode: 'TH', days: 10 }],
    requestedGb: 42.5,
  };
  const query = tripProfileToQuery(profile);
  assert.ok(query.includes('gb=42.5'));
  const parsed = tripProfileFromParams({ to: 'TH:10', gb: '42.5' });
  assert.equal(parsed.requestedGb, 42.5);
});

test('a nonsense GB figure is rejected rather than trusted', () => {
  assert.equal(parseRequestedGb('0'), undefined);
  assert.equal(parseRequestedGb('-5'), undefined);
  assert.equal(parseRequestedGb('abc'), undefined);
  assert.equal(parseRequestedGb(''), undefined);
  assert.equal(parseRequestedGb('999999'), 1000, 'clamped, not accepted as written');
});
