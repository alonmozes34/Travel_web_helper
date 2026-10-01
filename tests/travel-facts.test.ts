import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countryTravelFacts } from '@/data/countryFacts.generated';
import { parseLocalRates, quoteUnits } from '@/lib/sources/ecb/localCurrencyRates';
import { minutesAheadOfIsrael, utcOffsetMinutes } from '@/lib/travel/timeDifference';

const FEED = `<Cube time='2026-09-30'>
  <Cube currency='USD' rate='1.1000'/><Cube currency='JPY' rate='160.00'/>
  <Cube currency='THB' rate='38.000'/><Cube currency='IDR' rate='18000'/>
  <Cube currency='ILS' rate='4.0000'/></Cube>`;

test('every ECB currency gets a shekel rate, crossed through the euro', () => {
  const { ilsPer, asOf } = parseLocalRates(FEED);
  assert.equal(asOf, '2026-09-30');
  assert.equal(ilsPer.get('EUR'), 4);
  assert.ok(Math.abs(ilsPer.get('USD')! - 4 / 1.1) < 1e-9);
  assert.ok(Math.abs(ilsPer.get('THB')! - 4 / 38) < 1e-9);
  assert.equal(ilsPer.has('ILS'), false);
});

test('a feed without the shekel is refused, not half used', () => {
  assert.throws(() => parseLocalRates(`<Cube time='2026-09-30'><Cube currency='USD' rate='1.1'/></Cube>`));
});

test('the quoted amount reads naturally: one dollar, a hundred yen, ten thousand rupiah', () => {
  const { ilsPer } = parseLocalRates(FEED);
  assert.equal(quoteUnits(ilsPer.get('USD')!), 1);
  assert.equal(quoteUnits(ilsPer.get('JPY')!), 100);
  assert.equal(quoteUnits(ilsPer.get('THB')!), 100);
  assert.equal(quoteUnits(ilsPer.get('IDR')!), 10_000);
});

test('the time difference follows summer time on both sides', () => {
  const winter = new Date('2026-01-15T12:00:00Z');
  const summer = new Date('2026-07-15T12:00:00Z');
  assert.equal(utcOffsetMinutes('Asia/Kolkata', winter), 330);
  assert.equal(minutesAheadOfIsrael('Asia/Bangkok', winter), 5 * 60);
  assert.equal(minutesAheadOfIsrael('Asia/Bangkok', summer), 4 * 60);
  assert.equal(minutesAheadOfIsrael('Europe/London', winter), -2 * 60);
  assert.equal(minutesAheadOfIsrael('Asia/Jerusalem', summer), 0);
});

test('the generated facts agree with what every traveller knows', () => {
  const facts = (code: string) => countryTravelFacts[code]!;
  // The first run had the driving sides swapped (France "left").
  assert.equal(facts('FR').driving, 'right');
  assert.equal(facts('US').driving, 'right');
  assert.equal(facts('GB').driving, 'left');
  assert.equal(facts('JP').driving, 'left');
  assert.equal(facts('TH').driving, 'left');
  assert.deepEqual(facts('GB').plugs, ['G']);
  assert.deepEqual(facts('US').voltages, [120]);
  assert.equal(facts('FR').currencies[0].code, 'EUR');
  assert.equal(facts('TH').currencies[0].code, 'THB');
  assert.equal(facts('JP').capital[0].he, 'טוקיו');
  assert.equal(facts('US').emergency[0].number, '911');
  assert.equal(facts('TH').timeZone, 'Asia/Bangkok');
});

test('no capital is shown for Palestine or Western Sahara', () => {
  assert.deepEqual(countryTravelFacts.PS?.capital, []);
  assert.deepEqual(countryTravelFacts.EH?.capital, []);
});

test('every listed time zone is one the platform knows', () => {
  for (const [code, facts] of Object.entries(countryTravelFacts)) {
    if (!facts?.timeZone) continue;
    assert.doesNotThrow(() => utcOffsetMinutes(facts.timeZone!, new Date()), code);
  }
});
