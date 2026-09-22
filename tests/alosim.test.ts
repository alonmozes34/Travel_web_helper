import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getCountryByCode, countries } from '@/data/countries';
import {
  ALOSIM_OFFER_ID,
  alosimCountryCodes,
  alosimCoversCountry,
  alosimLink,
  alosimRegions,
} from '@/data/alosim';
import {
  alosimAffiliateId,
  alosimDestinations,
  alosimOfferIds,
} from '@/data/alosim.generated';

/**
 * The first real provider data in the repository. These tests guard the ways
 * a generated file quietly rots: a link that stops carrying the affiliate id
 * and therefore earns nothing, a destination mapped onto a country that does
 * not exist, and a lookup that answers for a destination aloSIM does not
 * actually sell.
 */
describe('aloSIM destinations', () => {
  test('both offers were imported', () => {
    assert.deepEqual([...alosimOfferIds], [3, 9]);
  });

  test('every link is https, on aloSIM’s own store', () => {
    for (const destination of alosimDestinations) {
      for (const link of Object.values(destination.links)) {
        assert.match(link, /^https:\/\//, destination.slug);
        assert.match(new URL(link).hostname, /(^|\.)alosim\.com$/, link);
      }
    }
  });

  test('every link carries the affiliate id, or it earns nothing', () => {
    for (const destination of alosimDestinations) {
      for (const link of Object.values(destination.links)) {
        assert.equal(
          new URL(link).searchParams.get('affid'),
          alosimAffiliateId,
          `${destination.slug} would pay nobody`,
        );
      }
    }
  });

  test('a link filed under an offer actually names that offer', () => {
    for (const destination of alosimDestinations) {
      for (const [offer, link] of Object.entries(destination.links)) {
        assert.equal(new URL(link).searchParams.get('oid'), offer, destination.slug);
      }
    }
  });

  test('every mapped destination is a real country, mapped once', () => {
    const seen = new Set<string>();
    for (const destination of alosimDestinations) {
      if (destination.countryCode === null) continue;
      assert.ok(getCountryByCode(destination.countryCode), destination.countryCode);
      assert.ok(!seen.has(destination.countryCode), `${destination.countryCode} appears twice`);
      seen.add(destination.countryCode);
    }
  });

  test('regional bundles carry no country code', () => {
    for (const region of alosimRegions) {
      assert.equal(region.countryCode, null, region.slug);
    }
    assert.ok(alosimRegions.length >= 12);
  });

  test('they cover every destination the hero puts forward', () => {
    // If aloSIM stopped selling for one of the six shortcuts on the homepage,
    // that is worth failing a build over rather than noticing in production.
    for (const country of countries.filter((entry) => entry.popular)) {
      assert.ok(alosimCoversCountry(country.code), `${country.names.en} is no longer covered`);
    }
  });

  test('a destination they do not sell gets null, never a shop front', () => {
    const uncovered = countries.find((country) => !alosimCoversCountry(country.code));
    assert.ok(uncovered, 'every country is covered, which is implausible');
    assert.equal(alosimLink(uncovered.code), null);
  });

  test('the lookup returns the configured offer by default', () => {
    const link = alosimLink('FR');
    assert.ok(link);
    assert.equal(new URL(link).searchParams.get('oid'), String(ALOSIM_OFFER_ID));
    // And the other offer is still reachable, for when the choice is settled.
    const other = alosimLink('FR', ALOSIM_OFFER_ID === 9 ? 3 : 9);
    assert.ok(other && other !== link);
  });

  test('the country list is sorted and matches the mapped destinations', () => {
    assert.deepEqual(alosimCountryCodes, [...alosimCountryCodes].sort());
    assert.equal(
      alosimCountryCodes.length,
      alosimDestinations.filter((entry) => entry.countryCode !== null).length,
    );
  });
});
