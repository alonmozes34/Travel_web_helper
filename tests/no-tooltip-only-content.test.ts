import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

/**
 * Nothing a reader needs may live only in a tooltip.
 *
 * A `title` attribute is invisible to touch users, unreachable by keyboard and
 * announced inconsistently by screen readers. It is fine as a duplicate of
 * something already on screen and never acceptable as the only copy of a fact.
 * This test is a regression guard, not a substitute for judgement: it fails on
 * any new `title=` in a component so that adding one is a deliberate decision.
 */
/**
 * Empty on purpose. The one exemption that used to live here — a disabled
 * compare checkbox whose title restated its visible label — turned out to be
 * redundant with the aria-label beside it, so the rule now holds everywhere.
 */
const ALLOWED = new Set<string>([]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

describe('no information lives only in a tooltip', () => {
  test('components do not add title attributes to markup', () => {
    const offenders: string[] = [];

    for (const file of walk('src/components')) {
      if (ALLOWED.has(file)) continue;
      const source = readFileSync(file, 'utf8');
      for (const [index, line] of source.split('\n').entries()) {
        // `title={...}` on a lowercase element is an HTML attribute; on a
        // capitalised component it is just a prop called title.
        if (/<[a-z][\w-]*[^>]*\stitle=/.test(line) || /^\s+title=\{/.test(line)) {
          const isComponentProp = /^\s+title=\{/.test(line) && !/<[a-z]/.test(line);
          if (!isComponentProp) offenders.push(`${file}:${index + 1}`);
        }
      }
    }

    assert.deepEqual(offenders, [], `title attributes found: ${offenders.join(', ')}`);
  });
});
