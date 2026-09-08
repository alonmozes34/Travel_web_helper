/**
 * Accessibility statement details.
 *
 * In Israel a public-facing site must publish an accessibility statement and a
 * route for reporting accessibility problems, under the Equal Rights for
 * Persons with Disabilities (Service Accessibility Adjustments) Regulations,
 * 5773-2013, with IS 5568 (which adopts WCAG 2.0 AA) as the technical standard.
 *
 * Every field below is deliberately null. A statement is a legal document, and
 * a placeholder name or phone number published as though it were real would be
 * worse than no statement at all — so the page marks each missing field, and
 * `isAccessibilityStatementComplete` gates indexing on the whole thing being
 * filled in.
 */
export type AccessibilityAuditor = {
  /** Licensed service-accessibility consultant (מורשה נגישות שירות). */
  name: string;
  licenceNumber: string;
};

export type AccessibilityContact = {
  /** Accessibility coordinator (רכז נגישות). */
  coordinatorName: string | null;
  phone: string | null;
  email: string | null;
  postalAddress: string | null;
  /** Business days within which a report is answered. */
  responseWindowDays: number | null;
};

export type AccessibilityStatement = {
  /** The legal entity operating the site. */
  legalEntityName: string | null;
  /** ISO date the accessibility work was last reviewed. */
  lastReviewedAt: string | null;
  /** Who carried out the review, once one has been carried out. */
  auditedBy: AccessibilityAuditor | null;
  contact: AccessibilityContact;
};

export const accessibilityStatement: AccessibilityStatement = {
  legalEntityName: null,
  lastReviewedAt: null,
  auditedBy: null,
  contact: {
    coordinatorName: null,
    phone: null,
    email: null,
    postalAddress: null,
    responseWindowDays: null,
  },
};

/** The standard the site is built against. Not a claim of certification. */
export const accessibilityStandard = {
  name: 'IS 5568',
  basis: 'WCAG 2.0',
  level: 'AA',
} as const;

export function missingAccessibilityFields(
  statement: AccessibilityStatement = accessibilityStatement,
): string[] {
  const missing: string[] = [];
  if (!statement.legalEntityName) missing.push('legalEntityName');
  if (!statement.lastReviewedAt) missing.push('lastReviewedAt');
  if (!statement.auditedBy) missing.push('auditedBy');
  if (!statement.contact.coordinatorName) missing.push('contact.coordinatorName');
  if (!statement.contact.phone) missing.push('contact.phone');
  if (!statement.contact.email) missing.push('contact.email');
  if (!statement.contact.responseWindowDays) missing.push('contact.responseWindowDays');
  return missing;
}

export function isAccessibilityStatementComplete(
  statement: AccessibilityStatement = accessibilityStatement,
): boolean {
  return missingAccessibilityFields(statement).length === 0;
}
