import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { bookingLink, bookingPage } from '@/lib/booking/links';

describe('Booking.com links', () => {
  test('hotels and cars open Booking’s own page for the country, in the page’s language', () => {
    assert.equal(bookingPage('hotels', 'GR', 'he'), 'https://www.booking.com/country/gr.he.html');
    assert.equal(bookingPage('cars', 'GR', 'he'), 'https://www.booking.com/cars/country/gr.he.html');
    assert.equal(bookingPage('hotels', 'JP', 'en'), 'https://www.booking.com/country/jp.en-gb.html');
  });

  test('the link is CJ’s deep-link form for our site, with no query string to lose', () => {
    const link = bookingLink('cars', 'IT', 'he');
    assert.equal(link, 'https://www.tkqlhce.com/links/101892359/type/dlg/https://www.booking.com/cars/country/it.he.html');
    assert.ok(!link!.includes('?'), 'a query string in the page address is lost or 404s through CJ');
  });

  test('no link for Israel or for anything that is not a country code', () => {
    assert.equal(bookingLink('hotels', 'IL', 'he'), null);
    assert.equal(bookingLink('hotels', undefined, 'he'), null);
    assert.equal(bookingLink('hotels', 'gr', 'he'), null);
    assert.equal(bookingLink('hotels', 'GRC', 'he'), null);
  });
});

describe('the rental comparison page', () => {
  test('is closed to real visitors while no rental network is connected — Booking is linked, never compared', async () => {
    const { rentalComparisonEnabled } = await import('../src/lib/carRental/registry');
    assert.equal(rentalComparisonEnabled({}), false);
    assert.equal(rentalComparisonEnabled({ DEMO_CATALOGUE: 'true' }), true);
  });
});
