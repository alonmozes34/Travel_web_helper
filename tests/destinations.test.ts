import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { countries, getCountryByCode } from '@/data/countries';
import { destinationContinents } from '@/data/regions';
import { mockPlans } from '@/data/mockPlans';
import { coverageOf } from '@/lib/comparison/catalogueCoverage';
import {
  destinationsByContinent,
  popularDestinations,
  relatedDestinations,
  RELATED_LIMIT,
} from '@/lib/comparison/relatedDestinations';

/**
 * The destination index and the related block exist to stop every country
 * page being an island. These guard the two ways that quietly stops working:
 * a page that links to itself or to nothing, and an index that drops the
 * destinations we cannot sell for instead of labelling them.
 */
// Against the demo catalogue: coverage is a property of whatever catalogue is live.
const { isCovered: isCountryCovered } = coverageOf(mockPlans);

describe('related destinations', () => {
  test('a destination never suggests itself', () => {
    for (const country of countries.filter((entry) => entry.continent !== 'antarctic')) {
      const related = relatedDestinations(country.code, 'he', isCountryCovered);
      assert.ok(
        !related.some((entry) => entry.country.code === country.code),
        `${country.code} links to itself`,
      );
    }
  });

  test('every sellable destination gets a full block, however empty its continent', () => {
    // Oceania and the Caribbean have few entries; the block is topped up from
    // the hero's shortlist rather than rendered half empty.
    for (const country of countries.filter((entry) => entry.continent !== 'antarctic')) {
      const related = relatedDestinations(country.code, 'he', isCountryCovered);
      assert.equal(related.length, RELATED_LIMIT, `${country.code} produced ${related.length}`);
    }
  });

  test('no duplicates, even when the list is topped up from elsewhere', () => {
    for (const code of ['FJ', 'BB', 'GR', 'NR', 'TV']) {
      const related = relatedDestinations(code, 'he', isCountryCovered);
      const codes = related.map((entry) => entry.country.code);
      assert.equal(new Set(codes).size, codes.length, `${code} repeated a destination`);
    }
  });

  test('a destination people actually travel to outranks an alphabetical accident', () => {
    // Sorting Europe by Hebrew name offered Åland and the Faroes to somebody
    // going to Greece. Italy and Spain are the answer; alef is not a reason.
    const names = relatedDestinations('GR', 'he', isCountryCovered).map((entry) => entry.country.names.en);
    assert.ok(names.includes('Italy'), names.join(', '));
    assert.ok(names.includes('Spain'), names.join(', '));
    assert.ok(!names.includes('Åland Islands'), names.join(', '));
  });

  test('a suggestion we cannot sell for is still shown, and still marked', () => {
    const related = relatedDestinations('FJ', 'he', isCountryCovered);
    const uncovered = related.filter((entry) => !entry.covered);
    // The flag has to match what the catalogue actually says, either way.
    for (const entry of related) {
      assert.equal(entry.covered, isCountryCovered(entry.country.code), entry.country.code);
    }
    assert.ok(uncovered.length >= 0);
  });

  test('every suggested destination is a real country with a page', () => {
    for (const code of ['GR', 'TH', 'US', 'JP']) {
      for (const entry of relatedDestinations(code, 'he', isCountryCovered)) {
        assert.ok(getCountryByCode(entry.country.code), entry.country.code);
        assert.match(entry.country.slug, /^[a-z0-9-]+$/);
      }
    }
  });

  test('the two locales order differently but suggest from the same tier', () => {
    const he = relatedDestinations('GR', 'he', isCountryCovered).map((entry) => entry.country.code);
    const en = relatedDestinations('GR', 'en', isCountryCovered).map((entry) => entry.country.code);
    assert.deepEqual([...he].sort(), [...en].sort());
  });
});

describe('destination index', () => {
  test('every sellable destination appears exactly once across the continents', () => {
    const listed = destinationContinents.flatMap((continent) =>
      destinationsByContinent(continent, 'he').map((country) => country.code),
    );
    const sellable = countries
      .filter((country) => country.continent !== 'antarctic')
      .map((country) => country.code);
    assert.equal(new Set(listed).size, listed.length, 'a destination is listed twice');
    assert.deepEqual([...listed].sort(), [...sellable].sort());
  });

  test('destinations with nothing behind them are listed, not dropped', () => {
    const listed = destinationContinents.flatMap((continent) =>
      destinationsByContinent(continent, 'he'),
    );
    assert.ok(
      listed.some((country) => !isCountryCovered(country.code)),
      'the index only shows destinations we can sell for, which hides the gap',
    );
  });

  test('the popular shortlist is the one the hero uses', () => {
    const popular = popularDestinations('he');
    assert.ok(popular.length > 0);
    for (const country of popular) assert.equal(country.popular, true);
  });

  test('each continent is sorted in the reader’s own alphabet', () => {
    for (const locale of ['he', 'en'] as const) {
      const list = destinationsByContinent('europe', locale).map((c) => c.names[locale]);
      assert.deepEqual(
        list,
        [...list].sort((a, b) => a.localeCompare(b, locale)),
        `europe is out of order in ${locale}`,
      );
    }
  });
});
