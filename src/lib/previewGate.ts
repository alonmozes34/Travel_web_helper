/**
 * The preview gate.
 *
 * Every price in this catalogue is invented, and each one is attached to a
 * real, named company. A public page saying what Airalo charges, when the
 * number was made up, is a misstatement about somebody else's commercial
 * terms — a warning banner does not cure that, and `noindex` does not make a
 * page private. So while the data is mock, the site is reachable only with a
 * shared password, which is enough to show a working product to a partner
 * programme without publishing fabricated offers to the world.
 *
 * It is deliberately default-closed. Forgetting to set the password in a
 * deployment must not silently publish the site: with neither a password nor
 * an explicit opt-out, every page returns 503 rather than its contents.
 */
/**
 * The realm the browser prints above its password box.
 *
 * ASCII only, and tested for it. HTTP header values are ByteStrings: a single
 * typographic dash here throws `Cannot convert argument to a ByteString` and
 * turns every 401 into a 500 — which is exactly what happened the first time,
 * on a site whose every other string is Hebrew.
 */
export const PREVIEW_REALM =
  'Yesh Klita preview - demo data, not real prices';

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
