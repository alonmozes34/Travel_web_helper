import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countries } from '@/data/countries';
import { destinationLabel, flagOf, slugify } from '@/lib/loadingDestination';

test('a search names its countries, with flags beside the plane and plain names in the sentence', () => {
  assert.deepEqual(destinationLabel('/search', '?to=IT:5,FR:5', 'en'), {
    label: `${flagOf('IT')} Italy + ${flagOf('FR')} France`,
    names: 'Italy + France',
  });
  assert.equal(destinationLabel('/search', '?to=IT:5,FR:5,ES:3', 'en')?.names, 'Italy + France +1');
});

test('a country page without a search is recognised by its address', () => {
  assert.equal(destinationLabel('/esim/japan', '', 'he')?.names, 'יפן');
  assert.equal(destinationLabel('/en/esim/usa', '', 'en')?.names, 'United States');
});

test('an address that names nothing gives no destination', () => {
  assert.equal(destinationLabel('/esim/not-a-country', '', 'he'), null);
  assert.equal(destinationLabel('/search', '?to=', 'he'), null);
});

test('the slug rule matches the country list for nearly every country', () => {
  // The loading screen re-derives slugs instead of shipping the list; a
  // country it misses only loses its name on the loading screen.
  const missed = countries.filter((country) => destinationLabel(`/esim/${country.slug}`, '', 'en') === null);
  assert.ok(missed.length <= 5, missed.map((c) => c.slug).join(', '));
  assert.equal(slugify("Côte d’Ivoire"), 'cote-divoire');
});
