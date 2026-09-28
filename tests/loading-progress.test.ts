import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estimatedProgress, LOADING_CEILING } from '../src/lib/loadingProgress';

test('the loading bar starts empty — not in the middle', () => {
  assert.equal(estimatedProgress(0), 0);
  assert.equal(estimatedProgress(-5), 0);
  assert.ok(estimatedProgress(100) < 5);
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
