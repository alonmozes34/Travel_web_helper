import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  accessibilityStatement,
  isAccessibilityStatementComplete,
  missingAccessibilityFields,
} from '@/data/accessibility';
import { allowIndexing } from '@/lib/site';

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
