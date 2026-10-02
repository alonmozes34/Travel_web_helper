import assert from 'node:assert/strict';
import { test } from 'node:test';
import { snapshotOf, summarise, trendFor, type PriceSnapshot } from '@/lib/priceHistory/summary';
import type { Plan } from '@/lib/types/plan';

const plan = (id: string, minor: number, currency: Plan['sourceCurrency'] = 'USD') =>
  ({ id, finalPriceMinor: minor, sourceCurrency: currency }) as Plan;

const day = (date: string, prices: Record<string, number>, currency: Plan['sourceCurrency'] = 'USD'): PriceSnapshot => ({
  date,
  prices: Object.fromEntries(Object.entries(prices).map(([id, minor]) => [id, { minor, currency }])),
});

const dates = (n: number) =>
  Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));

test('a snapshot records the price the provider charges, in its own currency', () => {
  const snapshot = snapshotOf([plan('a', 1250, 'EUR')], '2026-10-02');
  assert.deepEqual(snapshot, { date: '2026-10-02', prices: { a: { minor: 1250, currency: 'EUR' } } });
});

test('nothing is said about a plan seen on one day only', () => {
  const summary = summarise([day('2026-10-02', { a: 1000 })]);
  assert.deepEqual(summary?.plans, {});
  assert.equal(trendFor(plan('a', 900), summary), null);
});

test('a drop of 3% or more since the previous day is reported, with that day', () => {
  const summary = summarise([day('2026-10-01', { a: 1000, b: 1000 }), day('2026-10-02', { a: 900, b: 990 })]);
  assert.deepEqual(trendFor(plan('a', 900), summary), { kind: 'dropped', previousMinor: 1000, currency: 'USD', since: '2026-10-01' });
  // 1% is a rounding, not news.
  assert.equal(trendFor(plan('b', 990), summary), null);
});

test('a move in another currency is never compared', () => {
  const summary = summarise([day('2026-10-01', { a: 1000 }, 'EUR'), day('2026-10-02', { a: 1000 }, 'EUR')]);
  assert.equal(trendFor(plan('a', 500, 'USD'), summary), null);
});

test('"lowest in N days" needs two weeks of history and a price that moved', () => {
  const d = dates(20);
  const moved = summarise(d.map((date, i) => day(date, { a: i < 10 ? 1200 : 1000 })));
  assert.deepEqual(trendFor(plan('a', 1000), moved), { kind: 'lowest', days: 20 });
  const flat = summarise(d.map((date) => day(date, { a: 1000 })));
  assert.equal(trendFor(plan('a', 1000), flat), null);
  const short = summarise(d.slice(0, 10).map((date, i) => day(date, { a: i < 5 ? 1200 : 1000 })));
  assert.equal(trendFor(plan('a', 1000), short), null);
});

test('the summary covers the last 30 days only', () => {
  const d = dates(40);
  const summary = summarise(d.map((date, i) => day(date, { a: i === 0 ? 1 : 1000 })));
  assert.equal(summary?.days, 30);
  assert.equal(summary?.plans.a.lowestMinor, 1000);
});

test('no history, no trend', () => {
  assert.equal(trendFor(plan('a', 1000), null), null);
});
