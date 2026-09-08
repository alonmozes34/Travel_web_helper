import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  accessibilityStatement,
  isAccessibilityStatementComplete,
  missingAccessibilityFields,
} from '@/data/accessibility';

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
   */
  test('indexing is not enabled while the statement is incomplete', () => {
    if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true') return;
    assert.ok(
      isAccessibilityStatementComplete(),
      `indexing is on but these fields are still empty: ${missingAccessibilityFields().join(', ')}`,
    );
  });
});
