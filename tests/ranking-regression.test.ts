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

test('best value is priced against plans that do the job, not a 2GB plan', () => {
  assert.equal(pick('bestValue'), 'th-unlimited-10d');
  const order = comparison.rows.map((row) => row.plan.id);
  assert.ok(order.indexOf('asia-100gb-180d') > order.indexOf('asia-50gb-90d'), '$185 for 100GB is not better value than $100 for 50GB here');
});

test('cheapest carries the data when anything does', () => {
  assert.equal(pick('cheapest'), 'th-unlimited-10d');
});

test('at the same price, the plan for this country comes before the regional one', () => {
  assert.equal(pick('bestUnlimited'), 'th-unlimited-10d');
  const order = comparison.rows.map((row) => row.plan.id);
  assert.ok(order.indexOf('th-unlimited-10d') < order.indexOf('asia-unlimited-10d'));
});

test('best for browsing: most networks at the destination, then the cheapest of those', () => {
  assert.equal(pick('bestForBrowsing'), 'asia-unlimited-10d', 'three Thai networks for $35, not $100');
});
