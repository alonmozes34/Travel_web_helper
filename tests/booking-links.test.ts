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

  test('attractions open one city’s page, checked to exist, and nothing where none opened', async () => {
    const { bookingAttractionsCity } = await import('../src/data/booking-attractions.generated');
    const { attractionsCityName } = await import('../src/lib/booking/links');
    const [code, city] = Object.entries(bookingAttractionsCity)[0]!;
    assert.equal(
      bookingPage('attractions', code, 'he'),
      `https://www.booking.com/things-to-do/city/${code.toLowerCase()}/${city!.slug}.he.html`,
    );
    assert.equal(bookingPage('attractions', code, 'en'), `https://www.booking.com/things-to-do/city/${code.toLowerCase()}/${city!.slug}.en-gb.html`);
    assert.equal(attractionsCityName(code, 'he'), city!.he);
    const without = ['AQ', 'BV', 'HM'].find((cc) => !bookingAttractionsCity[cc]);
    assert.ok(without, 'a country with no city page');
    assert.equal(bookingPage('attractions', without, 'he'), null);
    assert.equal(bookingLink('attractions', without, 'he'), null);
    assert.equal(attractionsCityName(without, 'he'), null);
    // Never a country page: Booking answers those with "this page does not exist".
    for (const entry of Object.values(bookingAttractionsCity)) assert.match(entry!.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
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

describe('the Booking.com logo', () => {
  test('is a plain SVG with nothing that could run', async () => {
    const { readFileSync } = await import('node:fs');
    const svg = readFileSync(new URL('../public/providers/booking.svg', import.meta.url), 'utf8');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.doesNotMatch(svg, /<script|\bon[a-z]+=|href=|<foreignObject|<image/i);
  });
});
