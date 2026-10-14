import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { bookingCities } from '@/data/booking-cities.generated';
import { bookingLink } from '@/lib/booking/links';
import { bookingCityPage, plannerCountries } from '@/lib/booking/planner';

/**
 * The Booking.com planner (the owner, 14 October 2026): where in each country
 * of the trip, then a row of links per place. Every link is one Booking's page
 * opened for when checked, and nothing stands in for a missing one.
 */
const through = (page: string) => `https://www.tkqlhce.com/links/101892359/type/dlg/${page}`;

describe('the Booking.com planner', () => {
  test('one entry per country of the trip, in its order; Israel and unknown codes have none', () => {
    const countries = plannerCountries(['FR', 'IT', 'FR', 'IL', 'XX'], 'he');
    assert.deepEqual(countries.map((country) => country.code), ['FR', 'IT']);
    assert.equal(countries[1].name, 'איטליה');
  });

  test('the whole country: its hotels and cars pages, and its main city’s attractions, named', () => {
    const [france] = plannerCountries(['FR'], 'he');
    assert.equal(france.whole.links.hotels, bookingLink('hotels', 'FR', 'he'));
    assert.equal(france.whole.links.cars, bookingLink('cars', 'FR', 'he'));
    assert.equal(france.whole.links.attractions, through('https://www.booking.com/things-to-do/city/fr/paris.he.html'));
    assert.equal(france.whole.attractionsCity, 'פריז');
  });

  test('each city links exactly the pages that opened for it, and none in its place', () => {
    for (const code of ['FR', 'GR', 'IT', 'JP', 'TH', 'US']) {
      const [country] = plannerCountries([code], 'he');
      const cities = bookingCities[code] ?? [];
      assert.ok(cities.length >= 3, `${code} has its cities`);
      assert.equal(country.cities.length, cities.length);
      country.cities.forEach((place, i) => {
        const city = cities[i];
        assert.equal(place.key, `${code}/${city.slug}`);
        assert.equal(place.name, city.he);
        assert.equal(place.links.hotels, through(bookingCityPage('hotels', code, city.slug, 'he')));
        assert.equal(place.links.cars, city.cars ? through(bookingCityPage('cars', code, city.slug, 'he')) : null);
        assert.equal(place.links.attractions, city.attractions ? through(bookingCityPage('attractions', code, city.slug, 'he')) : null);
        for (const link of Object.values(place.links)) if (link) assert.ok(!link.includes('?'), 'a query string is lost through CJ');
      });
    }
  });

  test('a city’s three pages at Booking, in the page’s language', () => {
    assert.equal(bookingCityPage('hotels', 'IT', 'rome', 'he'), 'https://www.booking.com/city/it/rome.he.html');
    assert.equal(bookingCityPage('cars', 'IT', 'rome', 'en'), 'https://www.booking.com/cars/city/it/rome.en-gb.html');
    assert.equal(bookingCityPage('attractions', 'IT', 'rome', 'he'), 'https://www.booking.com/things-to-do/city/it/rome.he.html');
    const [italy] = plannerCountries(['IT'], 'en');
    assert.ok(italy.cities.some((place) => place.name === 'Rome'), 'English names on the English site');
  });

  test('no city is listed twice, and every name is in Hebrew on the Hebrew site where we have one', () => {
    for (const [code, cities] of Object.entries(bookingCities)) {
      const names = cities!.map((city) => city.he);
      assert.equal(new Set(names).size, names.length, `${code} lists a city twice`);
      const slugs = cities!.map((city) => city.slug);
      assert.equal(new Set(slugs).size, slugs.length, `${code} repeats an address`);
    }
  });
});
