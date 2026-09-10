/**
 * The preview gate.
 *
 * Every price in this catalogue is invented, and each one is attached to a
 * real, named company. A public page saying what Airalo charges, when the
 * number was made up, is a misstatement about somebody else's commercial
 * terms — a warning banner does not cure that, and `noindex` does not make a
 * page private.
 *
 * But gating the *whole* site turned out to be the wrong trade. The point of
 * deploying at all is that a partner programme wants to see a working
 * product before it hands over the credentials that would make the data real,
 * and a reviewer who opens the link and meets a password box learns nothing.
 *
 * So the gate is scoped to the pages that actually carry fabricated prices.
 * Measured, not assumed: the homepage, the English homepage and the
 * accessibility statement render zero prices and name zero providers, while
 * a country page renders seventeen prices across seven real companies. The
 * public half is a real site that says exactly what this is; the half that
 * would misrepresent somebody else stays behind the password, whose holder
 * gets the whole thing.
 *
 * It is deliberately default-closed. Forgetting to set the password in a
 * deployment must not silently publish those pages: with neither a password
 * nor an explicit opt-out, the gated paths return 503 rather than contents.
 */
export type GateDecision =
  | { kind: 'open' }
  | { kind: 'unconfigured' }
  | { kind: 'challenge' };

export type GateEnv = {
  /** The shared password. Never NEXT_PUBLIC_ — that would ship it to the browser. */
  password?: string;
  /** Explicit opt-out, for local development and the test suites. */
  allowUnprotected?: string;
  nodeEnv?: string;
};

/**
 * What to do with a request, before its credentials are looked at.
 *
 * Development is always open: `next dev` is not reachable from the internet,
 * and making a contributor set an environment variable to see their own work
 * buys nothing.
 */
export function gateMode(env: GateEnv): GateDecision {
  if (env.nodeEnv !== 'production') return { kind: 'open' };
  if (env.allowUnprotected === 'true') return { kind: 'open' };
  if (!env.password) return { kind: 'unconfigured' };
  return { kind: 'challenge' };
}

/**
 * Whether an `Authorization` header carries the shared password.
 *
 * The username is ignored: there is one credential, not accounts. Anything
 * malformed is a failure rather than an exception — this runs on every
 * request, and a crash here would be a far louder failure than a 401.
 */
export function isAuthorised(header: string | null, password: string): boolean {
  if (!header?.startsWith('Basic ')) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice('Basic '.length).trim());
  } catch {
    return false;
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) return false;

  return constantTimeEquals(decoded.slice(separator + 1), password);
}

/**
 * Compared without an early exit. The threat is remote for a shared preview
 * password, but a comparison that leaks its answer in its timing is the kind
 * of detail that is cheaper to get right than to argue about.
 */
function constantTimeEquals(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

/**
 * Route prefixes whose pages render plan data.
 *
 * Deliberately a small allow-nothing list rather than a pattern: a new route
 * that shows prices must be added here on purpose. The alternative — gating
 * everything except a public list — fails the other way, and would have
 * silently exposed prices the first time a route was renamed.
 */
const GATED_SEGMENTS = ['esim', 'search'] as const;

/**
 * Whether a path shows fabricated prices and therefore needs the password.
 *
 * The locale prefix is stripped first, so `/esim/thailand`, `/he/esim/thailand`
 * and `/en/esim/thailand` are all the same page as far as the gate cares.
 * Matching is on whole segments: `/esimulator` is not `/esim`.
 */
export function isGatedPath(pathname: string, knownLocales: readonly string[]): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const withoutLocale = knownLocales.includes(segments[0] ?? '') ? segments.slice(1) : segments;
  const first = withoutLocale[0];
  return first !== undefined && (GATED_SEGMENTS as readonly string[]).includes(first);
}


/**
 * The cookie the unlock page sets.
 *
 * It holds the password itself rather than a signed token. That is the same
 * secret HTTP Basic would have put in every request header, kept httpOnly and
 * secure, so it is no weaker — and it needs no signing key, which is one less
 * thing to configure wrongly on a preview that exists to be thrown away.
 */
export const PREVIEW_COOKIE = 'yeshklita_preview';

/** Constant-time, and false for an unset password so an empty one never opens the gate. */
export function matchesPreviewPassword(supplied: string, password: string): boolean {
  if (!password) return false;
  return constantTimeEquals(supplied, password);
}

/**
 * Where to send someone after they unlock.
 *
 * Only same-site absolute paths. A `next` parameter is attacker-controlled —
 * it arrives in a URL somebody can be sent — so anything that could leave the
 * origin is discarded rather than sanitised: `//evil.test`, `https://…`, and
 * the backslash forms browsers normalise to a slash.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.includes('\\')) return null;
  return next;
}
