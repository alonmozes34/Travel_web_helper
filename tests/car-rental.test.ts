import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  addDays,
  defaultRentalQuery,
  isSearchable,
  rentalDays,
  rentalQueryFromParams,
  rentalQueryToParams,
} from '@/lib/carRental/query';
import { configuredRentalSources, rentalSources, searchRentals } from '@/lib/carRental/registry';
import { demoRentalSource } from '@/lib/carRental/sources/demo';
import { pricePerDayMinor, type RentalOffer, type RentalSource } from '@/lib/carRental/types';
import { he } from '@/i18n/dictionaries/he';
import { en } from '@/i18n/dictionaries/en';

const TODAY = new Date('2026-09-21T00:00:00Z');

function query(overrides: Partial<ReturnType<typeof defaultRentalQuery>> = {}) {
  return { ...defaultRentalQuery('FR', 5, TODAY), pickupLocation: 'Paris CDG', ...overrides };
}

describe('rental query', () => {
  test('carries the country and the trip length from the eSIM search', () => {
    const q = defaultRentalQuery('FR', 5, TODAY);
    assert.equal(q.countryCode, 'FR');
    assert.equal(rentalDays(q), 5);
  });

  test('an unknown country is dropped rather than carried through', () => {
    assert.equal(defaultRentalQuery('ZZ', 5, TODAY).countryCode, '');
  });

  test('a missing or absurd trip length falls back to a sane default', () => {
    assert.equal(rentalDays(defaultRentalQuery('FR', undefined, TODAY)), 7);
    assert.equal(rentalDays(defaultRentalQuery('FR', 0, TODAY)), 7);
    assert.equal(rentalDays(defaultRentalQuery('FR', 5000, TODAY)), 90);
  });

  test('a query survives a round trip through the URL', () => {
    const original = query({ sameDropoff: false, dropoffLocation: 'Lyon', driverAge: 23 });
    const params = Object.fromEntries(new URLSearchParams(rentalQueryToParams(original)));
    const parsed = rentalQueryFromParams(params, TODAY);
    assert.deepEqual(parsed, original);
  });

  test('the same-place default survives a checkbox that sends nothing', () => {
    // An unticked checkbox submits no parameter at all, so the URL names the
    // exception. Without this the form would silently flip on every search.
    assert.equal(rentalQueryFromParams({ country: 'FR' }, TODAY).sameDropoff, true);
    assert.equal(rentalQueryFromParams({ country: 'FR', diff: '1' }, TODAY).sameDropoff, false);
  });

  test('a URL cannot describe a rental that ends before it starts', () => {
    const parsed = rentalQueryFromParams(
      { country: 'FR', from: '2026-10-10', until: '2026-10-01' },
      TODAY,
    );
    assert.ok(parsed.dropoffDate > parsed.pickupDate);
  });

  test('junk in the URL falls back instead of reaching a network', () => {
    const parsed = rentalQueryFromParams(
      { country: 'not-a-country', from: 'yesterday', age: '4', kind: 'helicopter' },
      TODAY,
    );
    assert.equal(parsed.countryCode, '');
    assert.equal(parsed.pickupKind, 'airport');
    assert.equal(parsed.driverAge, 30);
    assert.match(parsed.pickupDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('free text is bounded', () => {
    const parsed = rentalQueryFromParams({ country: 'FR', pickup: 'x'.repeat(5000) }, TODAY);
    assert.equal(parsed.pickupLocation.length, 120);
  });

  test('a country alone is not searchable — the city is asked for', () => {
    assert.equal(isSearchable(defaultRentalQuery('FR', 5, TODAY)), false);
    assert.equal(isSearchable(query()), true);
  });

  test('a different drop-off has to name where', () => {
    assert.equal(isSearchable(query({ sameDropoff: false, dropoffLocation: '' })), false);
    assert.equal(isSearchable(query({ sameDropoff: false, dropoffLocation: 'Lyon' })), true);
  });

  test('a same-day hire is one day, never zero', () => {
    const q = query({ pickupDate: '2026-10-01', dropoffDate: '2026-10-01' });
    assert.equal(rentalDays(q), 1);
  });

  test('addDays crosses a month boundary', () => {
    assert.equal(addDays('2026-10-30', 5), '2026-11-04');
  });
});

describe('demo rental source', () => {
  test('the same search returns the same cars', async () => {
    const first = await demoRentalSource.search(query());
    const second = await demoRentalSource.search(query());
    assert.deepEqual(
      first.offers.map((offer) => [offer.id, offer.totalPriceMinor]),
      second.offers.map((offer) => [offer.id, offer.totalPriceMinor]),
    );
  });

  test('a different search returns different prices', async () => {
    const paris = await demoRentalSource.search(query({ pickupLocation: 'Paris CDG' }));
    const lyon = await demoRentalSource.search(query({ pickupLocation: 'Lyon' }));
    assert.notDeepEqual(
      paris.offers.map((offer) => offer.totalPriceMinor),
      lyon.offers.map((offer) => offer.totalPriceMinor),
    );
  });

  test('every demo row is marked as demo and carries no booking link', async () => {
    const { offers } = await demoRentalSource.search(query());
    assert.ok(offers.length > 0);
    for (const offer of offers) {
      assert.equal(offer.source, 'demo');
      // There is nothing real to link to, so nobody is sent anywhere.
      assert.equal(offer.bookingUrl, null);
    }
  });

  test('no demo supplier borrows a real rental company name', async () => {
    const { offers } = await demoRentalSource.search(query());
    const real = /hertz|avis|sixt|europcar|budget|enterprise|thrifty|dollar|alamo|shlomo|eldan/i;
    for (const offer of offers) {
      assert.doesNotMatch(offer.supplierName, real, `${offer.supplierName} names a real company`);
    }
  });

  test('a longer hire costs less per day', async () => {
    const short = await demoRentalSource.search(query({ dropoffDate: addDays(query().pickupDate, 2) }));
    const long = await demoRentalSource.search(query({ dropoffDate: addDays(query().pickupDate, 14) }));
    assert.ok(pricePerDayMinor(long.offers[0]) < pricePerDayMinor(short.offers[0]));
  });

  test('a young driver is quoted more, not the same', async () => {
    const adult = await demoRentalSource.search(query({ driverAge: 35 }));
    const young = await demoRentalSource.search(query({ driverAge: 21 }));
    assert.ok(young.offers[0].totalPriceMinor > adult.offers[0].totalPriceMinor);
  });

  test('the per-day figure is derived from the total, so they cannot disagree', async () => {
    const { offers } = await demoRentalSource.search(query());
    for (const offer of offers) {
      assert.equal(pricePerDayMinor(offer), Math.round(offer.totalPriceMinor / offer.rentalDays));
    }
  });
});

describe('rental registry', () => {
  test('a network without credentials is never queried', () => {
    const configured = configuredRentalSources().map((source) => source.id);
    assert.ok(configured.includes('demo-rentals'));
    assert.ok(!configured.includes('discovercars'), 'an unconfigured network answered');
    assert.ok(!configured.includes('ofran'));
  });

  test('more than one network is registered, so the UI is not built around one', () => {
    const ids = rentalSources.map((source) => source.id);
    assert.ok(ids.length >= 3);
    assert.ok(ids.includes('discovercars') && ids.includes('ofran'));
  });

  test('results are ordered by price, never by which network sent them', async () => {
    const { offers } = await searchRentals(query());
    const prices = offers.map((offer) => offer.totalPriceMinor);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  test('a network that throws costs its own rows, not the search', async () => {
    const broken: RentalSource = {
      id: 'broken',
      label: 'Broken',
      isConfigured: () => true,
      search: () => Promise.reject(new Error('down')),
    };
    const { offers, sourceIds } = await searchRentals(query(), [broken, demoRentalSource]);
    assert.ok(offers.length > 0);
    assert.deepEqual(sourceIds, ['demo-rentals']);
  });

  test('an empty result is not described as entirely invented', async () => {
    const none: RentalSource = {
      id: 'none',
      label: 'None',
      isConfigured: () => true,
      search: async () => ({ sourceId: 'none', offers: [], skipped: [], searchedAt: '' }),
    };
    const summary = await searchRentals(query(), [none]);
    assert.equal(summary.allDemo, false);
    assert.equal(summary.mixed, false);
  });

  test('demo and real rows sharing a page is reported as mixed', async () => {
    const realOffer: RentalOffer = {
      ...(await demoRentalSource.search(query())).offers[0],
      id: 'real-1',
      sourceId: 'real',
      source: 'api',
      totalPriceMinor: 1,
    };
    const real: RentalSource = {
      id: 'real',
      label: 'Real',
      isConfigured: () => true,
      search: async () => ({ sourceId: 'real', offers: [realOffer], skipped: [], searchedAt: '' }),
    };
    const summary = await searchRentals(query(), [real, demoRentalSource]);
    assert.equal(summary.mixed, true);
    assert.equal(summary.allDemo, false);
  });
});

describe('rental copy', () => {
  test('every category, policy and pick-up kind is translated in both locales', async () => {
    const { offers } = await demoRentalSource.search(query());
    for (const offer of offers) {
      for (const dict of [he, en]) {
        assert.ok(dict.carRentalPage.categories[offer.category], `category ${offer.category}`);
        assert.ok(dict.carRentalPage.fuel[offer.fuelPolicy], `fuel ${offer.fuelPolicy}`);
        assert.ok(dict.carRentalPage.mileage[offer.mileagePolicy]);
        assert.ok(dict.carRentalPage.cancellation[offer.cancellation]);
        assert.ok(dict.carRentalPage.insurance[offer.insurance]);
        assert.ok(dict.carRentalPage.transmission[offer.transmission]);
      }
    }
  });

  test('a model is never promised, only offered as an example', () => {
    for (const dict of [he, en]) {
      assert.match(dict.carRentalPage.results.orSimilarTemplate, /\{model\}/);
      assert.ok(dict.carRentalPage.results.categoryOnly.length > 0);
    }
    assert.match(en.carRentalPage.results.orSimilarTemplate, /or similar/i);
  });

  test('the site never presents itself as a rental company', () => {
    assert.match(he.carRentalPage.intro, /לא משכירים/);
    assert.match(en.carRentalPage.intro, /do not rent cars/i);
  });
});
