import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { releasedOn, siteVersion } from '@/lib/version';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as { version: string };
const changelog = readFileSync(new URL('CHANGELOG.md', root), 'utf8');

test('the version is one number in three places', () => {
  assert.match(siteVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.version, siteVersion, 'package.json and src/lib/version.ts disagree');
});

test('the changelog opens with this version, on its release date', () => {
  const first = changelog.match(/^## (\d+\.\d+\.\d+) — (\d{1,2})\.(\d{1,2})\.(\d{4})/m);
  assert.ok(first, 'CHANGELOG.md has no version heading');
  assert.equal(first[1], siteVersion, 'the newest CHANGELOG entry is not the current version');
  const [, , day, month, year] = first;
  assert.equal(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, releasedOn);
});

test('versions only go up, newest first', () => {
  const versions = [...changelog.matchAll(/^## (\d+)\.(\d+)\.(\d+) —/gm)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
  for (let i = 1; i < versions.length; i++) {
    const [a, b] = [versions[i - 1], versions[i]];
    const newer = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    assert.ok(newer > 0, `${a.join('.')} is listed above ${b.join('.')} but is not newer`);
  }
});
