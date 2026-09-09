import {
  isAccessibilityStatementComplete,
  missingAccessibilityFields,
} from '@/data/accessibility';

/**
 * Canonical origin for metadata. Set NEXT_PUBLIC_SITE_URL in the deployment
 * environment; the localhost default keeps development links honest rather
 * than claiming a domain the prototype does not own.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Whether a deployment has asked to be indexed. Not the same as being allowed to. */
const indexingRequested = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

/**
 * Search engines are kept out until the plan data is real *and* the site is
 * legally publishable.
 *
 * Two conditions, both runtime, because both failures are silent and neither
 * is recoverable once a crawler has been through:
 *
 *  - NEXT_PUBLIC_ALLOW_INDEXING must be set. Indexing a site whose every
 *    price is invented would put fabricated offers in search results.
 *  - The accessibility statement must be filled in. In Israel a public-facing
 *    site must publish one under the Equal Rights for Persons with
 *    Disabilities (Service Accessibility Adjustments) Regulations, 5773-2013.
 *
 * The second condition used to live only in a unit test, which never runs on
 * the host where that environment variable actually gets set — and `next
 * build` does not run tests at all. A guard that only fires in a place the
 * risk does not exist is not a guard.
 */
export const allowIndexing = indexingRequested && isAccessibilityStatementComplete();

// Said out loud at build time: a deployment that asked to be indexed and
// quietly was not would otherwise look like a broken robots.txt.
if (indexingRequested && !allowIndexing && typeof window === 'undefined') {
  console.warn(
    '[site] NEXT_PUBLIC_ALLOW_INDEXING is set but the site stays noindex: ' +
      `the accessibility statement is missing ${missingAccessibilityFields().join(', ')}.`,
  );
}

/**
 * The Open Graph card for a locale.
 *
 * Referenced explicitly rather than left to Next's `opengraph-image` file
 * convention: this layout declares its own `openGraph` block, and a segment
 * that does so replaces the images it would otherwise inherit. The card was
 * generated, served and completely unreferenced until this was made explicit,
 * which is the sort of thing nobody notices until a link is shared.
 *
 * Kept in step with `shareImageName` in scripts/generate-brand-assets.ts.
 */
export function shareImagePath(locale: string): string {
  return `/share-${locale}.png`;
}

export const shareImageSize = { width: 1200, height: 630 } as const;
