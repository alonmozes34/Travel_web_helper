import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getDictionary } from '@/i18n/getDictionary';
import {
  BASE_DAILY_MB,
  dailyDataMbByUsage,
  dailyMbByActivity,
  dailyMbForActivities,
  estimateDataNeed,
} from '@/lib/comparison/estimateDataNeed';
import { estimateSummary } from '@/lib/comparison/estimateSummary';
import { countersFor } from '@/lib/stats/events';
import {
  activitiesForUsage,
  dataActivities,
  isTripDescribed,
  sameTrip,
  shownActivities,
  tripProfileFromParams,
  tripProfileToQuery,
  usageLevels,
  withCalculatorAnswer,
  type TripProfile,
} from '@/lib/types/trip';

/**
 * The data calculator (the owner, 15 October 2026): the traveller ticks what
 * they will do abroad, and the plan is fitted to the sum, instead of choosing
 * one of six usage levels.
 */
const trip = (extra: Partial<TripProfile>): TripProfile => ({ destinations: [{ countryCode: 'JP', days: 7 }], ...extra });

describe('the data calculator', () => {
  test('maps and messages always, and each tick adds its own figure', () => {
    assert.equal(dailyMbForActivities([]), BASE_DAILY_MB);
    assert.equal(dailyMbForActivities(['social', 'calls']), BASE_DAILY_MB + dailyMbByActivity.social + dailyMbByActivity.calls);
    for (const activity of dataActivities) assert.ok(dailyMbByActivity[activity] > 0, activity);
  });

  test('a traveller who touches nothing is sized as the old default, and can see why', () => {
    assert.deepEqual(shownActivities({ destinations: [] }), ['social']);
    assert.equal(dailyMbForActivities(shownActivities({ destinations: [] })), dailyDataMbByUsage.regular);
    const answered = withCalculatorAnswer(trip({}));
    assert.deepEqual(answered.activities, ['social']);
    assert.ok(isTripDescribed(answered));
  });

  test('a link from before the calculator still works, and is shown as ticks that never carry less', () => {
    const legacy = tripProfileFromParams({ to: 'JP:7', usage: 'heavy' });
    assert.equal(legacy.usage, 'heavy');
    assert.equal(legacy.activities, undefined);
    assert.equal(estimateDataNeed(legacy).dailyMb, dailyDataMbByUsage.heavy, 'the old link keeps its own figure');
    for (const level of usageLevels) {
      if (level === 'unlimited') continue;
      assert.ok(dailyMbForActivities(activitiesForUsage[level]) >= dailyDataMbByUsage[level], level);
    }
    // Searching again from the calculator searches what it showed.
    const again = withCalculatorAnswer(legacy);
    assert.deepEqual(again.activities, ['social', 'calls', 'video']);
    assert.equal(again.usage, undefined);
  });

  test('the ticks travel in the address, in one order, and "maps only" is still an answer', () => {
    const profile = trip({ activities: ['social', 'video'] });
    const query = tripProfileToQuery(profile);
    assert.equal(new URLSearchParams(query).get('act'), 'social,video');
    assert.ok(!query.includes('usage='), 'no level next to the ticks');
    assert.deepEqual(tripProfileFromParams({ to: 'JP:7', act: 'video,social,video' }).activities, ['social', 'video']);

    const mapsOnly = tripProfileFromParams({ to: 'JP:7', act: 'maps' });
    assert.deepEqual(mapsOnly.activities, []);
    assert.equal(new URLSearchParams(tripProfileToQuery(mapsOnly)).get('act'), 'maps');
    assert.equal(estimateDataNeed(mapsOnly).dailyMb, BASE_DAILY_MB);

    assert.equal(tripProfileFromParams({ to: 'JP:7', act: 'bogus' }).activities, undefined, 'nonsense is no answer');
    // A level next to ticks means only the preference for unlimited.
    assert.equal(tripProfileFromParams({ to: 'JP:7', act: 'social', usage: 'heavy' }).usage, undefined);
    assert.equal(tripProfileFromParams({ to: 'JP:7', act: 'social', usage: 'unlimited' }).usage, 'unlimited');
  });

  test('a changed tick is a changed trip', () => {
    assert.equal(sameTrip(trip({ activities: ['social'] }), trip({ activities: ['social'] })), true);
    assert.equal(sameTrip(trip({ activities: ['social'] }), trip({ activities: ['social', 'calls'] })), false);
    assert.equal(sameTrip(trip({ activities: [] }), trip({})), false);
  });

  test('unlimited is a preference: the ticks still say what a day its limit must carry', () => {
    const estimate = estimateDataNeed(trip({ activities: ['social', 'calls'], usage: 'unlimited' }));
    assert.equal(estimate.prefersUnlimited, true);
    assert.equal(estimate.dailyMb, dailyMbForActivities(['social', 'calls']));
    // The old unlimited link keeps its old, cautious figure.
    assert.equal(estimateDataNeed(trip({ usage: 'unlimited' })).dailyMb, dailyDataMbByUsage.unlimited);
  });

  test('a GB figure the traveller typed replaces the sum', () => {
    const estimate = estimateDataNeed(trip({ activities: ['hotspot'], requestedGb: 3 }));
    assert.equal(estimate.isStatedByTraveller, true);
    assert.equal(estimate.activities, undefined);
    assert.equal(Math.round(estimate.requiredGb), 3);
  });

  test('the line over the results says the daily amount that was on screen', () => {
    const he = getDictionary('he');
    const line = estimateSummary(estimateDataNeed(trip({ activities: ['social'] })), he, 'he');
    assert.ok(line.includes('600MB ליום'), line);
    assert.ok(line.includes('7 ימים'), line);
    const unlimited = estimateSummary(estimateDataNeed(trip({ activities: [], usage: 'unlimited' })), he, 'he');
    assert.ok(unlimited.includes('ללא הגבלת נפח') && unlimited.includes('150MB'), unlimited);
    const legacy = estimateSummary(estimateDataNeed(trip({ usage: 'regular' })), he, 'he');
    assert.ok(legacy.includes('שימוש רגיל'), legacy);
  });
});

describe('the calculator in the anonymous counts', () => {
  const context = { country: 'IL', device: 'phone' as const, ownHost: 'www.yeshklita.com' };
  const search = (extra: Record<string, unknown>) => ({
    e: 'search' as const,
    to: [{ cc: 'JP', days: 7 }],
    usage: null,
    gb: false,
    currency: 'ILS',
    count: 10,
    ...extra,
  });

  test('each tick is counted, and the searches it sized', () => {
    const counts = countersFor(search({ act: ['social', 'video'] }), context)!;
    assert.equal(counts['usage:calculator'], 1);
    assert.equal(counts.calculated, 1);
    assert.equal(counts['act:social'], 1);
    assert.equal(counts['act:video'], 1);
    assert.equal(counts['act:calls'], undefined);
  });

  test('only names from the calculator’s own list are counted', () => {
    const counts = countersFor(search({ act: ['social', 'my-home-address', 7] }), context)!;
    assert.deepEqual(
      Object.keys(counts).filter((key) => key.startsWith('act:')),
      ['act:social'],
    );
  });

  test('unlimited with ticks, a typed figure, and a page from before the calculator', () => {
    const unlimited = countersFor(search({ act: [], usage: 'unlimited' }), context)!;
    assert.equal(unlimited['usage:unlimited'], 1);
    assert.equal(unlimited.calculated, 1);
    const typed = countersFor(search({ act: ['hotspot'], gb: true }), context)!;
    assert.equal(typed['usage:stated-gb'], 1);
    assert.equal(typed['act:hotspot'], undefined, 'the ticks did not make that estimate');
    const before = countersFor(search({ usage: 'regular' }), context)!;
    assert.equal(before['usage:regular'], 1);
    assert.equal(before.calculated, undefined);
  });
});
