import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countries, getCountryBySlug, getCountryByCode, searchCountries, popularCountries } from '../src/data/countries';
import { continentIds } from '../src/data/countryTypes';

test('every ISO 3166-1 country is present', () => {
  // 249 officially assigned codes, plus XK for Kosovo, which providers sell.
  assert.equal(countries.length, 250);
  assert.ok(getCountryByCode('BR'), 'Brazil');
  assert.ok(getCountryByCode('MA'), 'Morocco');
  assert.ok(getCountryByCode('LK'), 'Sri Lanka');
  assert.ok(getCountryByCode('XK'), 'Kosovo');
});

test('codes and slugs are unique', () => {
  assert.equal(new Set(countries.map((c) => c.code)).size, countries.length);
  assert.equal(new Set(countries.map((c) => c.slug)).size, countries.length);
});

test('the URLs that already existed still resolve', () => {
  const existing = [
    ['thailand', 'TH'], ['greece', 'GR'], ['usa', 'US'], ['italy', 'IT'], ['france', 'FR'],
    ['japan', 'JP'], ['cyprus', 'CY'], ['georgia', 'GE'], ['turkey', 'TR'], ['spain', 'ES'],
    ['united-kingdom', 'GB'], ['united-arab-emirates', 'AE'], ['germany', 'DE'],
    ['netherlands', 'NL'], ['portugal', 'PT'], ['czechia', 'CZ'], ['vietnam', 'VN'],
    ['india', 'IN'], ['canada', 'CA'], ['australia', 'AU'],
  ];
  for (const [slug, code] of existing) {
    assert.equal(getCountryBySlug(slug)?.code, code, slug);
  }
});

test('every country has a name in both languages and a valid continent', () => {
  for (const country of countries) {
    assert.ok(country.names.he.length > 0, `${country.code} he`);
    assert.ok(country.names.en.length > 0, `${country.code} en`);
    assert.ok(!/[a-z]/i.test(country.names.he), `${country.code} Hebrew name is not Hebrew: ${country.names.he}`);
    assert.ok(continentIds.includes(country.continent), `${country.code} ${country.continent}`);
    assert.match(country.slug, /^[a-z0-9-]+$/, country.code);
  }
});

test('search finds a country by its Hebrew name, its English name and a city', () => {
  assert.equal(searchCountries('ברזיל', 'he')[0]?.code, 'BR');
  assert.equal(searchCountries('brazil', 'he')[0]?.code, 'BR');
  assert.equal(searchCountries('באלי', 'he')[0]?.code, 'ID');
  assert.equal(searchCountries('ארה"ב', 'he')[0]?.code, 'US');
  assert.equal(searchCountries('ארהב', 'he')[0]?.code, 'US');
  assert.equal(searchCountries('מרקש', 'he')[0]?.code, 'MA');
});

test('an exact name outranks a longer name that merely contains it', () => {
  // "גאורגיה" must not be buried under "דרום גאורגיה ואיי סנדוויץ׳ הדרומיים".
  assert.equal(searchCountries('גאורגיה', 'he')[0]?.code, 'GE');
  assert.equal(searchCountries('גינאה', 'he')[0]?.code, 'GN');
});

test('a popular destination breaks a tie, but never outranks a better match', () => {
  // Within one tier popularity decides: all four start with "י", so the two
  // destinations Israelis actually fly to lead.
  const codes = searchCountries('י', 'he', 8).map((c) => c.code);
  assert.ok(codes.indexOf('GR') < codes.indexOf('JO'), 'Greece before Jordan');
  assert.ok(codes.indexOf('JP') < codes.indexOf('IL'), 'Japan before Israel');

  // Across tiers the match quality decides: Italy is popular but only matches
  // on its second letter, so it may not jump above an exact prefix match.
  assert.ok(codes.indexOf('JO') < codes.indexOf('IT'), 'Jordan before Italy');
});

test('uninhabited territories are not offered as destinations', () => {
  assert.equal(searchCountries('אנטארקטיקה', 'he').length, 0);
  assert.equal(searchCountries('antarctica', 'he').length, 0);
});

test('the popular shortcuts are a small set of real countries', () => {
  assert.equal(popularCountries.length, 6);
  for (const country of popularCountries) assert.ok(getCountryByCode(country.code));
});
