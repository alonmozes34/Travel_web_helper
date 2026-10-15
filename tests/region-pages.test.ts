import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { countries, getCountryByCode } from '@/data/countries';
import { mockFxRates } from '@/data/fxRates';
import { regionPages } from '@/data/regionPages';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { MIN_REGION_COUNTRIES, orderFamilies, priceFamilies, regionFamilies } from '@/lib/comparison/regionOffers';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Plan } from '@/lib/types/plan';

/**
 * Region pages (the owner, 15 October 2026): which regional plans cover how
 * many of a region's countries, and which they leave out.
 */
function plan(overrides: Partial<Plan> & { id: string }): Plan {
  return {
    providerId: 'test',
    planName: 'Test plan',
    coverage: { kind: 'region', countries: ['HR', 'ME'], regionId: null, publishedDestinationCount: null },
    dataAmountMb: 5 * MB_PER_GB,
    isUnlimited: false,
    fairUsage: null,
    validityDays: 30,
    sourceCurrency: 'USD',
    originalPriceMinor: 1000,
    finalPriceMinor: 1000,
    discount: null,
    networks: [],
    hotspot: null,
    calls: null,
    sms: null,
    topUp: null,
    affiliateUrl: 'https://example.com/plan',
    affiliateLandsOn: 'plan',
    source: 'mock',
    lastUpdatedAt: null,
    ...overrides,
  };
}

const balkans = regionPages.find((region) => region.id === 'balkans')!.countries;
const cover = (codes: string[], kind: 'region' | 'global' = 'region') => ({ kind, countries: codes, regionId: null, publishedDestinationCount: null });

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('the region lists', () => {
  test('every code is a real country, listed once, and no region shares a country page’s address', () => {
    const slugs = new Set(countries.map((country) => country.slug));
    for (const region of regionPages) {
      assert.equal(new Set(region.countries).size, region.countries.length, `${region.id} lists a country twice`);
      for (const code of region.countries) assert.ok(getCountryByCode(code), `${region.id}: ${code}`);
      assert.ok(!slugs.has(region.id), `${region.id} is a country's slug`);
      assert.ok(region.countries.length > MIN_REGION_COUNTRIES);
    }
  });

  test('the lists never become a plan’s coverage: no source, catalogue or demo data reads them', () => {
    const roots = ['src/lib/sources', 'src/lib/catalogue', 'src/data'];
    for (const path of roots.flatMap(files)) {
      if (path.endsWith('regionPages.ts')) continue;
      assert.ok(!readFileSync(path, 'utf8').includes('regionPages'), `${path} imports the region pages`);
    }
  });
});

describe('the plans a region page compares', () => {
  test('a plan is in when its own list holds two of the region’s countries; its label never decides', () => {
    const families = regionFamilies(
      [
        plan({ id: 'two', coverage: cover(['HR', 'ME', 'IT']) }),
        plan({ id: 'one', coverage: cover(['HR', 'IT', 'FR']) }),
        plan({ id: 'named', coverage: { kind: 'region', countries: [], regionId: 'balkans', regionName: 'Balkans', publishedDestinationCount: 9 } }),
      ],
      balkans,
    );
    assert.deepEqual(families.map((family) => family.plans.map((p) => p.id)), [['two']]);
  });

  test('one card per provider and country list, its sizes together; what is missing in the region’s order', () => {
    const families = regionFamilies(
      [
        plan({ id: 'a1', coverage: cover(['ME', 'HR', 'AL', 'DE']) }),
        plan({ id: 'a2', coverage: cover(['AL', 'HR', 'ME', 'DE']), dataAmountMb: 10 * MB_PER_GB }),
        plan({ id: 'b1', providerId: 'other', coverage: cover(['HR', 'ME', 'AL', 'DE']) }),
      ],
      balkans,
    );
    assert.equal(families.length, 2);
    const first = families.find((family) => family.providerId === 'test')!;
    assert.deepEqual(first.plans.map((p) => p.id), ['a1', 'a2']);
    assert.deepEqual(first.coveredCodes, ['HR', 'ME', 'AL']);
    assert.deepEqual(first.missingCodes, balkans.filter((code) => !['HR', 'ME', 'AL'].includes(code)));
    assert.equal(first.outsideCount, 1);
  });

  test('a card’s price is the price of the plan’s row in a search', () => {
    const p = plan({ id: 'eur', sourceCurrency: 'EUR', originalPriceMinor: 1590, finalPriceMinor: 1290, coverage: cover(['HR', 'ME']) });
    const [priced] = priceFamilies(regionFamilies([p], balkans), 'ILS', mockFxRates);
    const row = buildComparison({
      profile: { destinations: [{ countryCode: 'HR', days: 7 }] },
      currency: 'ILS',
      plans: [p],
      rates: mockFxRates,
    }).rows.find((entry) => entry.plan.id === 'eur')!;
    assert.equal(priced.cheapest.price.amountMinor, row.price.amountMinor);
  });

  test('price per GB is compared over sizes valid for a week or more', () => {
    const [family] = priceFamilies(
      regionFamilies(
        [
          plan({ id: 'day', validityDays: 1, dataAmountMb: 512, finalPriceMinor: 50, originalPriceMinor: 50 }),
          plan({ id: 'month', validityDays: 30, dataAmountMb: 10 * MB_PER_GB, finalPriceMinor: 2000, originalPriceMinor: 2000 }),
        ],
        balkans,
      ),
      'USD',
      mockFxRates,
    );
    assert.equal(family.cheapest.plan.id, 'day', 'the cheapest size is still said');
    assert.equal(family.bestPerGb?.plan.id, 'month');
  });

  test('the stated order: most of the region, then price per GB, unlimited-only after, then price', () => {
    const plans = [
      plan({ id: 'few-cheap', providerId: 'p1', coverage: cover(['HR', 'ME']), finalPriceMinor: 100, originalPriceMinor: 100 }),
      plan({ id: 'all-dear', providerId: 'p2', coverage: cover([...balkans]), finalPriceMinor: 3000, originalPriceMinor: 3000 }),
      plan({ id: 'all-cheap', providerId: 'p3', coverage: cover([...balkans]), finalPriceMinor: 1500, originalPriceMinor: 1500 }),
      plan({ id: 'all-unlimited', providerId: 'p4', coverage: cover([...balkans]), isUnlimited: true, dataAmountMb: 0, finalPriceMinor: 900, originalPriceMinor: 900 }),
    ];
    const ordered = orderFamilies(priceFamilies(regionFamilies(plans, balkans), 'USD', mockFxRates));
    assert.deepEqual(ordered.map((family) => family.plans[0].id), ['all-cheap', 'all-dear', 'all-unlimited', 'few-cheap']);
    assert.equal(ordered[2].bestPerGb, null);
    assert.equal(ordered[2].hasUnlimited, true);
  });
});
