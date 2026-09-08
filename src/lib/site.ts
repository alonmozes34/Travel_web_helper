/**
 * Canonical origin for metadata. Set NEXT_PUBLIC_SITE_URL in the deployment
 * environment; the localhost default keeps development links honest rather
 * than claiming a domain the prototype does not own.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
