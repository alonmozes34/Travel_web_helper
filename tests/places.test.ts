import assert from 'node:assert/strict';
import { test } from 'node:test';
import places from '@/data/places.generated.json';
import { searchPlaces, type PlaceRow } from '@/lib/places/searchPlaces';

const rows = places as unknown as PlaceRow[];
const first = (query: string, locale: 'he' | 'en' = 'he') => searchPlaces(rows, query, locale)[0];

test('cities nobody had to list by hand lead to their country', () => {
  assert.deepEqual(first('נאפולי'), { name: 'נאפולי', countryCode: 'IT' });
  assert.equal(first('Chiang Mai', 'en')?.countryCode, 'TH');
  assert.equal(first("צ'אנג מאי")?.countryCode, 'TH');
  assert.equal(first('לאס וגאס')?.countryCode, 'US');
  assert.equal(first('בטומי')?.countryCode, 'GE');
});

test('a name shared by several places offers each, the bigger first', () => {
  const kingston = searchPlaces(rows, 'Kingston', 'en').map((match) => match.countryCode);
  assert.equal(kingston[0], 'JM');
  assert.ok(kingston.includes('CA'), kingston.join(','));
  // Naples, Italy before Naples, Florida.
  assert.equal(first('Naples', 'en')?.countryCode, 'IT');
});

test('the name is shown as it was typed: Hebrew for Hebrew, English for English', () => {
  assert.equal(first('נאפולי')?.name, 'נאפולי');
  // GeoNames also lists the Yiddish "נאפאלי"; English typing never gets it.
  assert.equal(first('Naples')?.name, 'Naples');
});

test('a city at home is found, so the field can say so', () => {
  assert.equal(first('אילת')?.countryCode, 'IL');
});

test('one letter is not a search', () => {
  assert.deepEqual(searchPlaces(rows, 'נ', 'he'), []);
});
