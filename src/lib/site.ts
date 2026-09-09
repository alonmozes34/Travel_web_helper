/**
 * Canonical origin for metadata. Set NEXT_PUBLIC_SITE_URL in the deployment
 * environment; the localhost default keeps development links honest rather
 * than claiming a domain the prototype does not own.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Search engines are kept out until the plan data is real.
 *
 * Indexing a site whose every price is invented would put fabricated offers in
 * search results, so indexing is opt-in and stays off until
 * NEXT_PUBLIC_ALLOW_INDEXING is explicitly set.
 */
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

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
