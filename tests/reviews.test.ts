import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { newReviewId, newestFirst, parseReview, tripMonths, validateReview, type Review } from '@/lib/reviews/reviews';
import { MAX_PENDING, memoryReviewStore, upstashReviewStore } from '@/lib/reviews/store';

/**
 * Travellers' reviews (the owner, 15 October 2026): a name or anonymous, a
 * date and a short text — published only once the owner approves, never an
 * input to the ranking, and nothing kept about the writer beyond what they
 * wrote.
 */
const TODAY = '2026-10-15';
const PROVIDERS = ['alosim', 'yesim', 'zensim', 'saily'];
const form = (extra: Record<string, string> = {}) => ({
  provider: 'saily',
  country: 'JP',
  month: '2026-09',
  recommends: 'yes',
  text: 'Worked from the moment we landed in Tokyo.',
  name: '',
  consent: 'yes',
  locale: 'he',
  ...extra,
});
const review = (id: string, extra: Partial<Review> = {}): Review => ({
  id,
  providerId: 'saily',
  countryCode: 'JP',
  tripMonth: '2026-09',
  recommends: true,
  text: 'Worked from the moment we landed.',
  name: null,
  sentOn: TODAY,
  locale: 'he',
  ...extra,
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('a review, as sent', () => {
  test('only the fields of the form, checked against fixed lists; no name is "anonymous"', () => {
    const checked = validateReview({ ...form(), email: 'a@b.c', ip: '1.2.3.4' }, { today: TODAY, providerIds: PROVIDERS });
    assert.ok(checked.ok);
    assert.deepEqual(Object.keys(checked.data).sort(), ['countryCode', 'locale', 'name', 'providerId', 'recommends', 'text', 'tripMonth']);
    assert.equal(checked.data.name, null);
    assert.equal(checked.data.recommends, true);
  });

  test('each wrong answer is named', () => {
    const checked = validateReview(
      form({ provider: 'voye', country: 'ZZ', month: '2023-01', recommends: 'maybe', text: 'short', name: 'x'.repeat(41), consent: '' }),
      { today: TODAY, providerIds: PROVIDERS },
    );
    assert.ok(!checked.ok);
    assert.deepEqual(checked.errors, {
      provider: 'required',
      country: 'required',
      month: 'required',
      recommends: 'required',
      text: 'tooShort',
      name: 'tooLong',
      consent: 'required',
    });
    const long = validateReview(form({ text: 'x'.repeat(601) }), { today: TODAY, providerIds: PROVIDERS });
    assert.ok(!long.ok && long.errors.text === 'tooLong');
  });

  test('a trip is this month or one of the seventeen before it, never a future one', () => {
    const months = tripMonths(TODAY);
    assert.equal(months.length, 18);
    assert.equal(months[0], '2026-10');
    assert.equal(months.at(-1), '2025-05');
    assert.ok(!validateReview(form({ month: '2026-11' }), { today: TODAY, providerIds: PROVIDERS }).ok);
  });

  test('an id is random and carries nothing', () => {
    const a = newReviewId();
    assert.match(a, /^[0-9a-f]{16}$/);
    assert.notEqual(a, newReviewId());
  });

  test('a stored value that is not a review is dropped', () => {
    assert.equal(parseReview('not json'), null);
    assert.equal(parseReview(JSON.stringify({ id: 'x' })), null);
    assert.equal(parseReview(JSON.stringify(review('abc')))?.name, null);
  });
});

describe('the owner decides', () => {
  test('waiting, then published or deleted; never edited', async () => {
    const store = memoryReviewStore();
    for (const r of await store.pending()) await store.remove(r.id);
    for (const r of await store.published()) await store.remove(r.id);
    assert.equal(await store.submit(review('aaaaaaaaaaaaaaa1')), 'saved');
    assert.equal(await store.submit(review('aaaaaaaaaaaaaaa2', { recommends: false })), 'saved');
    assert.equal((await store.published()).length, 0, 'nothing is published on arrival');
    assert.equal(await store.approve('aaaaaaaaaaaaaaa1'), true);
    assert.equal(await store.approve('nope'), false);
    await store.remove('aaaaaaaaaaaaaaa2');
    assert.deepEqual((await store.published()).map((r) => r.id), ['aaaaaaaaaaaaaaa1']);
    assert.equal((await store.pending()).length, 0);
    await store.remove('aaaaaaaaaaaaaaa1');
  });

  test('a full box says so rather than growing', async () => {
    const store = memoryReviewStore();
    for (let i = 0; i < MAX_PENDING; i += 1) await store.submit(review(`f${String(i).padStart(15, '0')}`));
    assert.equal(await store.submit(review('ffffffffffffffff')), 'full');
    for (const r of await store.pending()) await store.remove(r.id);
  });

  test('the real store moves a review with one pipeline, and sends nothing but the review', async () => {
    const calls: unknown[] = [];
    const fake = (async (_url: string, init: RequestInit) => {
      const commands = JSON.parse(String(init.body)) as unknown[][];
      calls.push(commands);
      const results = commands.map(([command]) =>
        command === 'HGET' ? { result: JSON.stringify(review('bbbbbbbbbbbbbbbb')) } : command === 'HLEN' ? { result: 0 } : { result: 1 },
      );
      return new Response(JSON.stringify(results));
    }) as typeof fetch;
    const store = upstashReviewStore('https://example.upstash.io', 'token', fake);
    assert.equal(await store.submit(review('bbbbbbbbbbbbbbbb')), 'saved');
    assert.equal(await store.approve('bbbbbbbbbbbbbbbb'), true);
    const saved = JSON.parse((calls[1] as unknown[][])[0][3] as string);
    assert.deepEqual(Object.keys(saved).sort(), ['countryCode', 'id', 'locale', 'name', 'providerId', 'recommends', 'sentOn', 'text', 'tripMonth']);
    assert.deepEqual((calls.at(-1) as unknown[][]).map((c) => c[0]), ['HSET', 'HDEL']);
  });

  test('newest first', () => {
    const ordered = newestFirst([review('a', { sentOn: '2026-10-01' }), review('b', { sentOn: '2026-10-14' })]);
    assert.deepEqual(ordered.map((r) => r.id), ['b', 'a']);
  });
});

describe('reviews never reach the comparison', () => {
  test('nothing under the comparison, catalogue, sources, affiliate or data imports them', () => {
    const roots = ['src/lib/comparison', 'src/lib/catalogue', 'src/lib/sources', 'src/lib/affiliate', 'src/data'];
    for (const path of roots.flatMap(files)) {
      assert.ok(!readFileSync(path, 'utf8').includes('@/lib/reviews'), `${path} imports the reviews`);
    }
  });
});
