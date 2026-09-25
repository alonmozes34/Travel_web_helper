/**
 * Accessibility statement details.
 *
 * In Israel a public-facing site must publish an accessibility statement and a
 * route for reporting accessibility problems, under the Equal Rights for
 * Persons with Disabilities (Service Accessibility Adjustments) Regulations,
 * 5773-2013, with IS 5568 (which adopts WCAG 2.0 AA) as the technical standard.
 *
 * Nothing here is a placeholder. A statement is a legal document, and a name
 * or phone number published as though it were real when nobody supplied it
 * would be worse than no statement at all — so a field nobody has given stays
 * null, the page marks it, and `isAccessibilityStatementComplete` gates
 * indexing on the routes that genuinely cannot be missing.
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

/**
 * Who operates the site.
 *
 * "No registered business" is an answer, not a blank. A personal project run
 * by one person before any company exists is the ordinary way something like
 * this starts, and a statement that marks it as a missing field says
 * something false about the operator — while inviting them to invent a
 * company name to make the warning go away.
 *
 * Named separately from a registered entity so the page can state either
 * truthfully, in whichever language it is being read.
 */
export type AccessibilityOperator =
  | { kind: 'individual' }
  | { kind: 'entity'; name: string };

export type AccessibilityStatement = {
  /** Who runs the site — an individual, or a registered entity by name. */
  operator: AccessibilityOperator;
  /** ISO date the accessibility work was last reviewed. */
  lastReviewedAt: string | null;
  /** Who carried out the review, once one has been carried out. */
  auditedBy: AccessibilityAuditor | null;
  contact: AccessibilityContact;
};

export const accessibilityStatement: AccessibilityStatement = {
  // A personal project. No company exists, and inventing one to fill a field
  // would be the one thing a legal document must never do.
  operator: { kind: 'individual' },
  // The date the technical review below was last run in full: axe-core across
  // eight states of the site plus twenty-three manual checks, all passing.
  // A date for work that happened — explicitly not a licensed audit, which the
  // page states separately and which a website does not require.
  lastReviewedAt: '2026-09-25',
  auditedBy: null,
  contact: {
    coordinatorName: null,
    phone: null,
    // Supplied by the operator. The one thing the statement could not go
    // without: somewhere for a visitor who hits a barrier to report it. It is
    // the site's own address, published deliberately, not a personal one
    // picked up from anywhere.
    email: 'yeshklita.info@gmail.com',
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

/**
 * The fields a published statement genuinely cannot go without.
 *
 * Narrower than the full shape, and deliberately so. The regulations do not
 * ask a one-person site for everything this type can hold:
 *
 *  - `auditedBy` — a licensed מורשה נגישות שירות is not required to approve a
 *    website under regulation 35. That mechanism belongs to physical premises.
 *  - `contact.coordinatorName` — a רכז נגישות is required of an organisation
 *    with 25 employees or more.
 *  - `contact.phone` / `contact.postalAddress` / `responseWindowDays` — a
 *    route for reporting a problem is required; a particular one is not.
 *
 * Demanding all of them produced a live page carrying eight "not yet set"
 * markers, four of them in the section that asks people to report a problem —
 * so it asked for reports and gave nobody anywhere to send one. That is worse
 * than a shorter statement, and it was not what the law asked for either.
 *
 * This is not legal advice, and the reading behind it is recorded in the
 * README rather than left implied.
 */
export function missingAccessibilityFields(
  statement: AccessibilityStatement = accessibilityStatement,
): string[] {
  const missing: string[] = [];
  // `operator` is always answerable — an individual is an answer — so it is
  // never missing, only one value or the other.
  if (!statement.lastReviewedAt) missing.push('lastReviewedAt');
  // At least one way to reach a human. Which one is the operator's choice.
  if (!hasContactRoute(statement)) missing.push('contact.email or contact.phone');
  return missing;
}

/** Whether a visitor who finds a barrier has somewhere to report it. */
export function hasContactRoute(
  statement: AccessibilityStatement = accessibilityStatement,
): boolean {
  return Boolean(statement.contact.email || statement.contact.phone);
}


export function isAccessibilityStatementComplete(
  statement: AccessibilityStatement = accessibilityStatement,
): boolean {
  return missingAccessibilityFields(statement).length === 0;
}
