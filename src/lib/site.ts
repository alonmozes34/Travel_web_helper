import {
  isAccessibilityStatementComplete,
  missingAccessibilityFields,
} from '@/data/accessibility';

/**
 * Resolves the canonical origin from the environment.
 *
 * Three sources, in order of how much they can be trusted to be what we mean
 * by "this site":
 *
 *  1. `NEXT_PUBLIC_SITE_URL` — set deliberately, so it wins. This is the real
 *     domain once there is one.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — the host's own production domain,
 *     injected at build and at runtime. It exists before anyone has bought a
 *     domain, and it becomes the custom domain automatically once one is
 *     attached, so a first deploy needs no manual URL and no second deploy to
 *     correct one. Note it is the *production* domain even on a preview
 *     build, which is what a canonical tag should say — a preview must not
 *     advertise itself as the canonical copy.
 *  3. localhost, which keeps development links honest rather than claiming a
 *     domain the prototype does not own.
 *
 * Deliberately not `VERCEL_URL`: that is the per-deployment hostname and
 * changes on every push, which would make every canonical link and every
 * share card point at a URL that stops being the site tomorrow.
 */
export function resolveSiteUrl(env: {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const host = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  // The host supplies a bare hostname, never a scheme.
  if (host) return `https://${host.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;

  return 'http://localhost:3000';
}

/** Canonical origin for metadata, canonical links, the sitemap and share cards. */
export const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

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
