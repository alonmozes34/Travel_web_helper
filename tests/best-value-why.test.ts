import assert from 'node:assert/strict';
import { test } from 'node:test';
import { explainBestValue } from '@/lib/comparison/explainBestValue';
import type { Plan } from '@/lib/types/plan';

const plan = (id: string, over: Partial<Plan> = {}): Plan => ({
  id,
  providerId: id,
  planName: id,
  coverage: { kind: 'country', countries: ['US'], regionId: null, publishedDestinationCount: null },
  dataAmountMb: 0,
  isUnlimited: true,
  fairUsage: { thresholdMb: null, per: null, throttledToKbps: null },
  validityDays: 30,
  sourceCurrency: 'USD',
  originalPriceMinor: 1,
  finalPriceMinor: 1,
  discount: null,
  localPricesMinor: {},
  networks: [],
  hotspot: null,
  calls: null,
  sms: null,
  topUp: null,
  affiliateUrl: 'https://example.com',
  affiliateLandsOn: 'plan',
  source: 'api',
  lastUpdatedAt: null,
  ...over,
});
const prices: Record<string, number> = { yesim: 15684, alosim: 21137, small: 3000, big: 4500 };
const priceOf = (p: Plan) => prices[p.id];

test('the owner\'s case: best value on the dearest unlimited plan says what the extra buys', () => {
  const alosim = plan('alosim', {
    fairUsage: { thresholdMb: 3072, per: null, throttledToKbps: 1000 },
    networks: [{ countryCode: 'US', operator: 'AT&T', mccMnc: null, technologies: ['5G'], coverage: null }],
  });
  const why = explainBestValue(alosim, plan('yesim'), priceOf, ['US']);
  assert.ok(why);
  assert.equal(why.extraMinor, 21137 - 15684);
  assert.equal(why.cheapestPlanId, 'yesim');
  assert.deepEqual(why.reasons, ['statesSlowdown', 'fiveG']);
});

test('nothing to explain when best value is the cheapest, or costs no more', () => {
  const p = plan('yesim');
  assert.equal(explainBestValue(p, p, priceOf), null);
  assert.equal(explainBestValue(plan('small'), plan('big'), priceOf), null);
});

test('only facts both providers published: more data, unlimited, networks, hotspot', () => {
  const small = plan('small', { isUnlimited: false, dataAmountMb: 5120, fairUsage: null });
  const big = plan('big', { isUnlimited: false, dataAmountMb: 10240, fairUsage: null, hotspot: true });
  assert.deepEqual(explainBestValue(big, small, priceOf)?.reasons, ['moreData', 'hotspot']);
  const unlimited = plan('big', { fairUsage: null });
  assert.deepEqual(explainBestValue(unlimited, small, priceOf)?.reasons, ['unlimited']);
});

test('a 5G network elsewhere does not count for this trip', () => {
  const abroad = plan('alosim', {
    networks: [{ countryCode: 'CA', operator: 'Rogers', mccMnc: null, technologies: ['5G'], coverage: null }],
  });
  assert.deepEqual(explainBestValue(abroad, plan('yesim'), priceOf, ['US'])?.reasons, []);
});
