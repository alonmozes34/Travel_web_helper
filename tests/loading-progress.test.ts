import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estimatedProgress, LOADING_CEILING, noteLoadingProgress, takeLoadingProgress } from '../src/lib/loadingProgress';

test('the loading bar starts empty — not in the middle', () => {
  assert.equal(estimatedProgress(0), 0);
  assert.equal(estimatedProgress(-5), 0);
  assert.ok(estimatedProgress(50) < 10, 'a few percent in the first moment, not half');
});

test('it only ever moves forward, and never claims to be done', () => {
  let last = 0;
  for (let ms = 0; ms <= 60_000; ms += 50) {
    const now = estimatedProgress(ms);
    assert.ok(now >= last, `went back at ${ms}ms`);
    assert.ok(now < 100 && now <= LOADING_CEILING, `${now}% at ${ms}ms`);
    last = now;
  }
});

test('the usual wait of a couple of seconds shows real movement', () => {
  assert.ok(estimatedProgress(1000) >= 25);
  assert.ok(estimatedProgress(3000) >= 60);
});

test('paced to the live site: about half by half a second, most of the way by one', () => {
  assert.ok(estimatedProgress(500) >= 45, `${estimatedProgress(500)}% at 0.5s`);
  assert.ok(estimatedProgress(1000) >= 70, `${estimatedProgress(1000)}% at 1s`);
});

test('where the bar stopped is handed to the page that replaces it, once, and only if recent', () => {
  noteLoadingProgress(63, 1000);
  assert.equal(takeLoadingProgress(1500), 63);
  assert.equal(takeLoadingProgress(1600), null, 'taken once');
  noteLoadingProgress(40, 1000);
  assert.equal(takeLoadingProgress(5000), null, 'a stale hand-off does not play');
});
