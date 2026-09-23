import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { accessibilityStatement } from '@/data/accessibility';
import { privacyReviewedOn, storedItems } from '@/data/privacy';
import { he } from '@/i18n/dictionaries/he';
import { en } from '@/i18n/dictionaries/en';

/**
 * A privacy notice is a claim about software, and software changes. These
 * tests exist so the page cannot quietly become untrue: the one that matters
 * scans the source for storage keys and fails when one is not disclosed.
 */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, found);
    else if (/\.(ts|tsx)$/.test(entry)) found.push(path);
  }
  return found;
}

describe('privacy notice', () => {
  test('every storage key in the source is disclosed on the page', () => {
    // The shapes this project uses: `yeshklita_*` for cookies, `yk.*` for
    // browser storage. A new one that nobody adds to `storedItems` fails here
    // rather than being silently undisclosed.
    const disclosed = new Set(storedItems.map((item) => item.key));
    const pattern = /'(yeshklita_[a-z_]+|yk\.[A-Za-z.]+)'/g;
    const undisclosed = new Set<string>();

    for (const file of sourceFiles('src')) {
      const contents = readFileSync(file, 'utf8');
      for (const match of contents.matchAll(pattern)) {
        if (!disclosed.has(match[1])) undisclosed.add(`${match[1]} (${file})`);
      }
    }

    assert.deepEqual(
      [...undisclosed],
      [],
      'these keys are written by the code but are not on the privacy page',
    );
  });

  test('nothing disclosed is invented — every key is one the code defines', () => {
    const source = sourceFiles('src')
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    for (const item of storedItems) {
      assert.ok(source.includes(`'${item.key}'`), `${item.key} appears nowhere in the code`);
    }
  });

  test('every stored item is explained in both languages', () => {
    for (const item of storedItems) {
      for (const dict of [he, en]) {
        assert.ok(dict.privacyPage.storage.purposes[item.purpose], `${item.purpose}`);
        assert.ok(dict.privacyPage.storage.kinds[item.kind], `${item.kind}`);
      }
    }
  });

  test('the contact address is the site’s one address, not a second one', () => {
    // One address, already published on the accessibility statement. A legal
    // page carrying a different one is how a reader ends up writing into a
    // void.
    assert.ok(accessibilityStatement.contact.email);
    assert.match(accessibilityStatement.contact.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  test('neither page carries a placeholder', () => {
    const suspicious = /(lorem|example\.com|your company|company name|\[.*\]|xxx|tbd|placeholder|חברה בע"מ|שם החברה)/i;
    for (const dict of [he, en]) {
      const text = [
        dict.privacyPage.intro,
        ...dict.privacyPage.operator.body,
        ...dict.privacyPage.notCollected.items,
        ...dict.privacyPage.logs.body,
        ...dict.privacyPage.outbound.body,
        ...dict.privacyPage.rights.body,
        dict.termsPage.intro,
        ...dict.termsPage.sections.flatMap((section) => section.body),
      ];
      for (const line of text) assert.doesNotMatch(line, suspicious, line.slice(0, 60));
    }
  });

  test('the notice never claims to store nothing at all', () => {
    // It would be the easy sentence to write and it would be false: there are
    // cookies, browser storage and the host's request logs.
    for (const dict of [he, en]) {
      assert.ok(dict.privacyPage.logs.body.length > 0, 'server logs are not mentioned');
      assert.ok(storedItems.length > 0);
    }
    assert.match(en.privacyPage.logs.body.join(' '), /IP address/i);
  });

  test('the review date is a real date', () => {
    assert.match(privacyReviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(new Date(privacyReviewedOn).getTime()));
  });
});

describe('terms of use', () => {
  test('the price caveat is present, in both languages', () => {
    // The realistic complaint against a comparison site is a figure somebody
    // relied on. The page has to say where the binding price lives.
    assert.match(he.termsPage.sections.map((s) => s.body.join(' ')).join(' '), /המחיר המחייב/);
    assert.match(
      en.termsPage.sections.map((s) => s.body.join(' ')).join(' '),
      /binding price is the one on the provider/i,
    );
  });

  test('the site never presents itself as the seller', () => {
    assert.match(he.termsPage.intro, /לא מוכרים/);
    assert.match(en.termsPage.intro, /do not sell/i);
  });

  test('the two locales carry the same sections', () => {
    assert.equal(he.termsPage.sections.length, en.termsPage.sections.length);
    for (let index = 0; index < he.termsPage.sections.length; index += 1) {
      assert.equal(
        he.termsPage.sections[index].body.length,
        en.termsPage.sections[index].body.length,
        `section ${index} differs between locales`,
      );
    }
  });
});
