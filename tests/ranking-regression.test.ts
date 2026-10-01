import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mockFxRates } from '@/data/fxRates';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Network } from '@/lib/types/network';
import type { Plan } from '@/lib/types/plan';

/**
 * Ten days of tethering in Thailand, as the owner searched it on the live site
 * on 25 September 2026 with aloSIM's real catalogue — prices here are theirs,
 * in dollars. "Best value" came back as a 100GB, 180-day Asia bundle at $185,
 * "cheapest" as a 2GB plan, and "best for browsing" as a 50GB bundle at $100.
 */
const thai = (operator: string): Network => ({ countryCode: 'TH', operator, mccMnc: null, technologies: ['5G'], coverage: null });

function plan(id: string, fields: Partial<Plan>): Plan {
  return {
    id,
    providerId: 'alosim',
    planName: id,
    coverage: { kind: 'country', countries: ['TH'], regionId: null, publishedDestinationCount: null },
    dataAmountMb: 0,
    isUnlimited: false,
    fairUsage: null,
    validityDays: 30,
    sourceCurrency: 'USD',
    originalPriceMinor: 0,
    finalPriceMinor: 0,
    discount: null,
    networks: [thai('AIS')],
    hotspot: null,
    calls: null,
    sms: null,
    topUp: null,
    affiliateUrl: null,
    source: 'api',
    lastUpdatedAt: null,
    ...fields,
  };
}

const price = (usd: number) => ({ originalPriceMinor: usd * 100, finalPriceMinor: usd * 100 });
const asia = { kind: 'region' as const, countries: ['TH', 'JP', 'VN'], regionId: 'asia', publishedDestinationCount: null };
const capped = { thresholdMb: 3 * MB_PER_GB, per: null, throttledToKbps: 1000 };
const threeNetworks = [thai('True'), thai('AIS'), thai('DTAC')];

const plans = [
  plan('th-2gb-15d', { dataAmountMb: 2 * MB_PER_GB, validityDays: 15, ...price(5) }),
  plan('th-20gb-30d', { dataAmountMb: 20 * MB_PER_GB, validityDays: 30, ...price(19.5) }),
  plan('th-unlimited-10d', { isUnlimited: true, fairUsage: capped, validityDays: 10, ...price(35) }),
  plan('asia-unlimited-10d', { isUnlimited: true, fairUsage: capped, validityDays: 10, coverage: asia, networks: threeNetworks, ...price(35) }),
  plan('asia-50gb-90d', { dataAmountMb: 50 * MB_PER_GB, validityDays: 90, coverage: asia, networks: threeNetworks, ...price(100) }),
  plan('asia-100gb-180d', { dataAmountMb: 100 * MB_PER_GB, validityDays: 180, coverage: asia, networks: threeNetworks, ...price(185) }),
];

const comparison = buildComparison({
  profile: { destinations: [{ countryCode: 'TH', days: 10 }], usage: 'hotspot' },
  currency: 'USD',
  plans,
  rates: mockFxRates,
});
const pick = (key: keyof typeof comparison.recommendations) => comparison.recommendations[key]?.planId;

// The Thailand and Asia unlimited plans are the same price, days and cap from
// the same provider; the Asia one reaches three Thai networks to the Thailand
// one's one, so the Thailand one is not listed twice over (`withoutRedundant`).
test('the recommended order is priced against plans that do the job, not a 2GB plan', () => {
  assert.equal(comparison.rows[0].plan.id, 'asia-unlimited-10d');
  const order = comparison.rows.map((row) => row.plan.id);
  assert.ok(order.indexOf('asia-100gb-180d') > order.indexOf('asia-50gb-90d'), '$185 for 100GB is not better value than $100 for 50GB here');
});

test('cheapest carries the data when anything does', () => {
  assert.equal(pick('cheapest'), 'asia-unlimited-10d');
});

test("the same provider's plan with fewer networks here, at the same price, is not listed twice", () => {
  const order = comparison.rows.map((row) => row.plan.id);
  assert.ok(!order.includes('th-unlimited-10d'));
  assert.equal(pick('bestUnlimited'), 'asia-unlimited-10d');
});

test('at the same price, days, data and networks, the plan for this country is the one kept', () => {
  const tie = buildComparison({
    profile: { destinations: [{ countryCode: 'TH', days: 10 }], usage: 'hotspot' },
    currency: 'USD',
    plans: [plans[2], { ...plans[3], networks: plans[2].networks }],
    rates: mockFxRates,
  });
  assert.deepEqual(tie.rows.map((row) => row.plan.id), ['th-unlimited-10d']);
});

test('best for browsing: most networks at the destination, then the cheapest of those', () => {
  assert.equal(pick('bestForBrowsing'), 'asia-unlimited-10d', 'three Thai networks for $35, not $100');
});

// From the audit of 360 live pages on 28 September 2026.
test('the same days and data for less is never ranked below, whatever the network', () => {
  const uae = { kind: 'country' as const, countries: ['AE'], regionId: null, publishedDestinationCount: null };
  const withFiveG = plan('alosim-ae-3gb', {
    coverage: uae,
    dataAmountMb: 3 * MB_PER_GB,
    networks: [{ countryCode: 'AE', operator: 'du', mccMnc: null, technologies: ['5G'], coverage: null }],
    ...price(9),
  });
  const cheaperNoNetwork = plan('yesim-ae-3gb', { providerId: 'yesim', coverage: uae, dataAmountMb: 3 * MB_PER_GB, networks: [], ...price(8) });
  const cheapest = plan('alosim-ae-1gb', { coverage: uae, dataAmountMb: 1 * MB_PER_GB, networks: [], ...price(3) });
  const rows = buildComparison({
    profile: { destinations: [{ countryCode: 'AE', days: 7 }], usage: 'navigation' },
    currency: 'USD',
    plans: [withFiveG, cheaperNoNetwork, cheapest],
    rates: mockFxRates,
  }).rows.map((row) => row.plan.id);
  assert.ok(rows.indexOf('yesim-ae-3gb') < rows.indexOf('alosim-ae-3gb'), rows.join(' > '));
});

test('five times the price for data the trip does not use does not outrank a cheaper unlimited plan', () => {
  const japan = { kind: 'country' as const, countries: ['JP'], regionId: null, publishedDestinationCount: null };
  const asiaJp = { kind: 'region' as const, countries: ['JP', 'TH'], regionId: 'asia', publishedDestinationCount: null };
  const ranked = buildComparison({
    profile: { destinations: [{ countryCode: 'JP', days: 30 }], usage: 'heavy' },
    currency: 'USD',
    plans: [
      plan('jp-50gb-30d', { coverage: japan, networks: [], dataAmountMb: 50 * MB_PER_GB, ...price(35) }),
      plan('asia-100gb-180d', { coverage: asiaJp, networks: [], dataAmountMb: 100 * MB_PER_GB, validityDays: 180, ...price(185) }),
      plan('jp-unlimited-30d', {
        providerId: 'yesim',
        coverage: japan,
        networks: [],
        isUnlimited: true,
        fairUsage: { thresholdMb: null, per: null, throttledToKbps: null },
        ...price(48),
      }),
    ],
    rates: mockFxRates,
  }).rows.map((row) => row.plan.id);
  assert.equal(ranked[0], 'jp-50gb-30d');
  assert.ok(ranked.indexOf('jp-unlimited-30d') < ranked.indexOf('asia-100gb-180d'), ranked.join(' > '));
});

test('a label goes to a plan that does the job, not one in the "not enough" section', () => {
  const th = { kind: 'country' as const, countries: ['TH'], regionId: null, publishedDestinationCount: null };
  const comparison = buildComparison({
    profile: { destinations: [{ countryCode: 'TH', days: 14 }], usage: 'hotspot' },
    currency: 'USD',
    plans: [
      plan('th-50gb-30d', { providerId: 'yesim', coverage: th, networks: [], dataAmountMb: 50 * MB_PER_GB, ...price(32) }),
      plan('th-unlimited-14d', {
        providerId: 'yesim',
        coverage: th,
        networks: [],
        isUnlimited: true,
        validityDays: 14,
        fairUsage: { thresholdMb: null, per: null, throttledToKbps: null },
        ...price(28),
      }),
    ],
    rates: mockFxRates,
  });
  const cheapest = comparison.rows.find((row) => row.plan.id === comparison.recommendations.cheapest?.planId);
  assert.equal(cheapest?.plan.id, 'th-unlimited-14d');
  assert.equal(cheapest?.isBelowEstimatedNeed, false);
});

test("the page keeps the comparison's order under 'recommended', repairs included", async () => {
  const { sortRows } = await import('@/lib/comparison/sort');
  const rows = comparison.rows;
  assert.deepEqual(sortRows(rows, 'recommended').map((row) => row.plan.id), rows.map((row) => row.plan.id));
});

test('an unlimited month slowed to a usable 1Mbps beats a far dearer 80GB, 365-day plan for heavy use', () => {
  const fr = { kind: 'country' as const, countries: ['FR'], regionId: null, publishedDestinationCount: null };
  const world = { kind: 'global' as const, countries: ['FR', 'US', 'JP'], regionId: null, publishedDestinationCount: null };
  const ranked = buildComparison({
    profile: { destinations: [{ countryCode: 'FR', days: 30 }], usage: 'heavy' },
    currency: 'USD',
    plans: [
      plan('fr-50gb-30d', { coverage: fr, networks: [], dataAmountMb: 50 * MB_PER_GB, ...price(50) }),
      plan('fr-unlimited-30d', { coverage: fr, networks: [], isUnlimited: true, fairUsage: capped, ...price(68) }),
      plan('global-80gb-365d', { providerId: 'yesim', coverage: world, networks: [], dataAmountMb: 80 * MB_PER_GB, validityDays: 365, ...price(124) }),
    ],
    rates: mockFxRates,
  }).rows.map((row) => row.plan.id);
  assert.ok(ranked.indexOf('fr-unlimited-30d') < ranked.indexOf('global-80gb-365d'), ranked.join(' > '));
});

test('a combination is offered only when it is cheaper than one plan that does the job', async () => {
  const { shouldOfferCombination } = await import('@/lib/comparison/buildCombination');
  const combination = { totalMinor: 5000 } as Parameters<typeof shouldOfferCombination>[0];
  const row = (amountMinor: number, fits = true) => ({ coversTrip: fits, isBelowEstimatedNeed: false, price: { amountMinor } });
  assert.equal(shouldOfferCombination(combination, [row(4000)]).offer, false, 'dearer than a plan that covers the trip');
  assert.equal(shouldOfferCombination(combination, [row(6000)]).offer, true, 'cheaper than every plan that covers the trip');
  assert.equal(shouldOfferCombination(combination, [row(900, false)]).offer, true, 'a 1GB plan that covers nothing is not the yardstick');
  assert.equal(shouldOfferCombination(combination, []).offer, true, 'nothing else does the job');
});

test('the list opens by price, cheapest first, and ties go to the better-scoring plan', async () => {
  const { DEFAULT_SORT, sortRows } = await import('@/lib/comparison/sort');
  assert.equal(DEFAULT_SORT, 'price');
  const ids = sortRows(comparison.rows, DEFAULT_SORT).map((row) => row.price.amountMinor);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
});
