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
