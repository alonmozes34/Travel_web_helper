/**
 * The site's version, as the footer shows it and CHANGELOG.md records it.
 *
 * 0.x until public launch. The minor number moves with each release of new
 * behaviour a visitor could notice; the patch number with fixes only. Moving
 * it is three edits that a test holds together: this constant, `version` in
 * package.json, and a new entry at the top of CHANGELOG.md — then a git tag
 * `v<version>` on the commit.
 */
export const siteVersion = '0.6.3';

/** The day this version was released, `YYYY-MM-DD`. */
export const releasedOn = '2026-09-25';

/**
 * The commit the running deployment was built from, when the host says.
 * Shown beside the version so anyone can tell which build is live — the one
 * question a version number alone cannot answer between two releases.
 */
export const buildCommit: string | null = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null;
