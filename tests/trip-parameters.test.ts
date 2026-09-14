import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  isTripDescribed,
  missingTripFields,
  parseRequestedGb,
  sameTrip,
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

describe('an edited trip against the one on screen', () => {
  const base = { destinations: [{ countryCode: 'TH', days: 14 }], usage: 'regular' as const };

  test('the same trip is the same trip', () => {
    assert.equal(sameTrip(base, { ...base, destinations: [...base.destinations] }), true);
  });

  test('removing a destination is a change', () => {
    // The bug this exists for: the chip disappeared and the heading, the flag
    // and the plans all stayed, because nothing compared the two.
    assert.equal(sameTrip(base, { ...base, destinations: [] }), false);
  });

  test('removing one of several is a change', () => {
    const two = { ...base, destinations: [{ countryCode: 'DE', days: 3 }, { countryCode: 'US', days: 10 }] };
    assert.equal(sameTrip(two, { ...two, destinations: [two.destinations[1]] }), false);
  });

  test('changing the days or the usage is a change', () => {
    assert.equal(sameTrip(base, { ...base, destinations: [{ countryCode: 'TH', days: 7 }] }), false);
    assert.equal(sameTrip(base, { ...base, usage: 'heavy' }), false);
  });

  test('a stated GB figure counts', () => {
    assert.equal(sameTrip(base, { ...base, usage: undefined, requestedGb: 20 }), false);
    assert.equal(
      sameTrip({ ...base, usage: undefined, requestedGb: 20 }, { ...base, usage: undefined, requestedGb: 20 }),
      true,
    );
  });

  test('order matters, because the URL and the heading carry it', () => {
    const de = { countryCode: 'DE', days: 3 };
    const us = { countryCode: 'US', days: 10 };
    assert.equal(sameTrip({ destinations: [de, us] }, { destinations: [us, de] }), false);
  });

  test('an unset day and an unset usage are not a change', () => {
    assert.equal(sameTrip({ destinations: [{ countryCode: 'TH' }] }, { destinations: [{ countryCode: 'TH' }] }), true);
  });
});

describe('a URL cannot describe a trip the interface would refuse', () => {
  test('a two-letter code that is not a country is dropped', () => {
    // It used to render "eSIM for ZZ" and then reassure the traveller that an
    // eSIM might still exist there — about two letters that are not a place.
    assert.deepEqual(tripProfileFromParams({ to: 'ZZ:5' }).destinations, []);
    assert.deepEqual(tripProfileFromParams({ to: 'ZZ:5,TH:3' }).destinations, [
      { countryCode: 'TH', days: 3 },
    ]);
  });

  test('a destination appears once, and the first entry wins', () => {
    assert.deepEqual(tripProfileFromParams({ to: 'TH:5,TH:3' }).destinations, [
      { countryCode: 'TH', days: 5 },
    ]);
    assert.deepEqual(tripProfileFromParams({ to: 'TH:5,JP:2,TH:9' }).destinations, [
      { countryCode: 'TH', days: 5 },
      { countryCode: 'JP', days: 2 },
    ]);
  });

  test('real destinations are still read exactly as before', () => {
    assert.deepEqual(tripProfileFromParams({ to: 'GR:3,JP:5', usage: 'regular' }), {
      destinations: [
        { countryCode: 'GR', days: 3 },
        { countryCode: 'JP', days: 5 },
      ],
      usage: 'regular',
    });
  });
})
