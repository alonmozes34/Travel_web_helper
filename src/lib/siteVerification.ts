/**
 * Site-ownership verification tokens issued by partner platforms.
 *
 * These are public by design — the whole point is that a crawler can read the
 * tag — so they live in the repository rather than in an environment
 * variable. A token in an env var would also mean the tag disappears from any
 * preview or local build, which is exactly when a verification failure is
 * hardest to explain.
 *
 * A LIST, not a single value, because impact.com hands out a fresh token each
 * time the "Add Website" dialog is opened. Deploying one and then reopening
 * the dialog invalidates the deploy — a race that costs a build cycle every
 * time and is invisible until the check fails. Every token we have ever been
 * issued stays here and stays in the page, so whichever one their checker
 * happens to hold, it finds it. They are meaningless to anyone else and cost
 * one line of markup each.
 *
 * impact.com issues its tag as `<meta name="impact-site-verification"
 * value="…">`. That `value` attribute is not the HTML standard — a `meta`
 * element carries `content` — but it is what their checker was given, so it
 * is what the page emits, verbatim, alongside the standard `content` form.
 */
export const impactSiteVerificationTokens = [
  'd5ba34ba-7ca1-49fb-b386-c8a19431adb7',
  '425e3bf5-065d-4c1d-86c7-eb675f47b795',
  '41734050-b592-4c9b-be4c-ad4b6a459efa',
] as const;
