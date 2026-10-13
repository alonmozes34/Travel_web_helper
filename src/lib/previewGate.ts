/**
 * The preview gate. Off unless asked for.
 *
 * It existed because the catalogue attached invented prices to real, named
 * companies, and a public page stating what Airalo charges — where the number
 * was made up — is a false claim about somebody else's commercial terms. A
 * warning banner does not cure that, so the pages carrying those prices needed
 * a password.
 *
 * The catalogue no longer names anyone: the demo providers are plainly demo
 * providers. Nobody is misrepresented, so nothing needs hiding, and the site
 * is public — which is the point, since a comparison tool nobody can open is
 * not much of a demonstration.
 *
 * The machinery stays because the need recurs: set `PREVIEW_GATE=on` together
 * with `SITE_PASSWORD` and the priced routes close again. Both are required,
 * so a password left behind in a dashboard cannot quietly shut the site.
 * Within that opt-in the gate is still default-closed: asking for it without
 * supplying a password serves nothing rather than serving everything.
 */
export type GateDecision =
  | { kind: 'open' }
  | { kind: 'unconfigured' }
  | { kind: 'challenge' };

export type GateEnv = {
  /** Must be exactly "on". Anything else, including unset, leaves the site public. */
  gate?: string;
  /** The shared password. Never NEXT_PUBLIC_ — that would ship it to the browser. */
  password?: string;
};

/**
 * What to do with a request, before its credentials are looked at.
 *
 * Turning the gate on is an explicit act, so there is no environment to
 * special-case: development and production behave the same, and the test
 * suites need no opt-out to see the site.
 */
export function gateMode(env: GateEnv): GateDecision {
  if (env.gate !== 'on') return { kind: 'open' };
  if (!env.password) return { kind: 'unconfigured' };
  return { kind: 'challenge' };
}

/**
 * Whether an `Authorization` header carries the shared password.
 *
 * The username is ignored: there is one credential, not accounts. Anything
 * malformed is a failure rather than an exception — this runs on every
 * request, and a crash here would be a far louder failure than a 401.
 *
 * Browsers send the credentials as UTF-8, and `atob` hands back bytes, so a
 * password with a Hebrew letter in it never matched (the owner could not
 * open the dashboard, 13 October 2026). The bytes are read as UTF-8 first,
 * and as they came for a browser that sent Latin-1; both sides are
 * normalised, so the same letters typed on another keyboard still match.
 */
export function isAuthorised(header: string | null, password: string): boolean {
  if (!password || !header?.startsWith('Basic ')) return false;

  let bytes: string;
  try {
    bytes = atob(header.slice('Basic '.length).trim());
  } catch {
    return false;
  }

  // A space before or after is not part of a password anyone means to type:
  // the configured value is trimmed, so the typed one is too.
  const wanted = password.trim().normalize('NFC');
  return [utf8(bytes), bytes].some((decoded) => {
    if (decoded === null) return false;
    const separator = decoded.indexOf(':');
    return separator !== -1 && constantTimeEquals(decoded.slice(separator + 1).trim().normalize('NFC'), wanted);
  });
}

/** `atob`'s bytes read as UTF-8, or null when they are not UTF-8. */
function utf8(bytes: string): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes, (char) => char.charCodeAt(0)));
  } catch {
    return null;
  }
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
const GATED_SEGMENTS = ['esim', 'search', 'car-rental'] as const;

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
