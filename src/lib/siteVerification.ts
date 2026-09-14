/**
 * Site-ownership verification tokens issued by partner platforms.
 *
 * These are public by design — the whole point is that a crawler can read the
 * tag — so they live in the repository rather than in an environment
 * variable. A token in an env var would also mean the tag disappears from any
 * preview or local build, which is exactly when a verification failure is
 * hardest to explain.
 *
 * impact.com issues its tag as `<meta name="impact-site-verification"
 * value="…">`. That `value` attribute is not the HTML standard — a `meta`
 * element carries `content` — but it is what their checker was given, so it
 * is what the page emits, verbatim, alongside the standard `content` form.
 * Emitting only the standard one risks failing a checker that string-matches
 * what it issued; emitting only theirs leaves an attribute no other tool
 * understands. Both cost one line each.
 */
export const impactSiteVerification = 'd5ba34ba-7ca1-49fb-b386-c8a19431adb7';
