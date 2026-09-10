import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  accessibilityStatement,
  isAccessibilityStatementComplete,
  missingAccessibilityFields,
} from '@/data/accessibility';
import { allowIndexing, resolveSiteUrl, siteUrlMismatch } from '@/lib/site';

/**
 * An accessibility statement is a legal document. Publishing one with
 * placeholder contact details would be worse than publishing none, so the
 * details are either real or visibly absent — never invented.
 */
describe('accessibility statement', () => {
  test('no field is filled with a plausible-looking placeholder', () => {
    const values = [
      accessibilityStatement.legalEntityName,
      accessibilityStatement.lastReviewedAt,
      accessibilityStatement.auditedBy?.name,
      accessibilityStatement.auditedBy?.licenceNumber,
      accessibilityStatement.contact.coordinatorName,
      accessibilityStatement.contact.phone,
      accessibilityStatement.contact.email,
      accessibilityStatement.contact.postalAddress,
    ];
    const suspicious = /(example|test|lorem|xxx|123456|דוגמה|לדוגמה|ישראל ישראלי|000)/i;
    for (const value of values) {
      if (value == null) continue;
      assert.ok(!suspicious.test(value), `"${value}" looks like a placeholder, not a real detail`);
    }
  });

  test('a missing field is reported rather than defaulted', () => {
    const missing = missingAccessibilityFields();
    assert.equal(isAccessibilityStatementComplete(), missing.length === 0);
  });

  /**
   * The guardrail that matters: the site must not be opened to search engines
   * while its accessibility statement is still a skeleton.
   *
   * Asserted against the value the application actually serves, not against
   * the environment variable. The earlier version of this test only ran when
   * NEXT_PUBLIC_ALLOW_INDEXING happened to be set in the shell — which is
   * never true on the host where it is really set, and `next build` does not
   * run tests anyway. The gate now lives in `src/lib/site.ts`; this holds it
   * there.
   */
  test('indexing is refused while the statement is incomplete', () => {
    if (isAccessibilityStatementComplete()) return;
    assert.equal(
      allowIndexing,
      false,
      `indexing is on but these fields are still empty: ${missingAccessibilityFields().join(', ')}`,
    );
  });

  test('a complete statement is what releases the gate', () => {
    // Guards the other direction: once the statement is filled in, indexing
    // must follow the environment variable and nothing else — so that a
    // finished statement cannot be silently ignored either.
    if (!isAccessibilityStatementComplete()) return;
    assert.equal(allowIndexing, process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true');
  });
});

describe('canonical origin', () => {
  test('an explicitly configured URL wins', () => {
    assert.equal(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://yeshklita.co.il',
        VERCEL_PROJECT_PRODUCTION_URL: 'travel-web-helper.vercel.app',
      }),
      'https://yeshklita.co.il',
    );
  });

  test("the host's production domain is used when none is configured", () => {
    // So a first deploy needs no URL and no second deploy to correct one.
    assert.equal(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'travel-web-helper.vercel.app' }),
      'https://travel-web-helper.vercel.app',
    );
  });

  test('localhost is the last resort, never a domain we do not own', () => {
    assert.equal(resolveSiteUrl({}), 'http://localhost:3000');
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '   ' }), 'http://localhost:3000');
  });

  test('a trailing slash or a scheme the host did not send is normalised away', () => {
    // Two of these produced "https://host//share-he.png" in an OG tag.
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://a.test/' }), 'https://a.test');
    assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'a.test/' }), 'https://a.test');
    assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'https://a.test' }), 'https://a.test');
  });
});

describe('a configured origin that contradicts the host', () => {
  test('is reported, naming both', () => {
    // The failure that shipped: a domain that was never bought.
    const warning = siteUrlMismatch('https://yeshklita.co.il', 'www.yeshklita.com');
    assert.ok(warning, 'a mismatch must be reported');
    assert.match(warning, /yeshklita\.co\.il/);
    assert.match(warning, /www\.yeshklita\.com/);
    assert.match(warning, /blank preview/);
  });

  test('agreement is silent', () => {
    assert.equal(siteUrlMismatch('https://www.yeshklita.com', 'www.yeshklita.com'), null);
    // The host sends a bare hostname, but tolerate a scheme and a trailing slash.
    assert.equal(siteUrlMismatch('https://a.test', 'https://a.test/'), null);
    assert.equal(siteUrlMismatch('https://A.TEST', 'a.test'), null);
  });

  test('nothing is claimed when the host says nothing', () => {
    // Off Vercel there is no second opinion, so there is no disagreement.
    assert.equal(siteUrlMismatch('https://a.test', undefined), null);
    assert.equal(siteUrlMismatch('https://a.test', ''), null);
  });

  test('an unparsable configured value is not reported as a mismatch', () => {
    // It is a different bug, and resolveSiteUrl has already dealt with it.
    assert.equal(siteUrlMismatch('not a url', 'a.test'), null);
  });
});
