/**
 * Destinations this visitor has searched for before.
 *
 * This is not analytics and must never become analytics. Nothing is sent
 * anywhere: the codes live in this browser's localStorage, they are readable
 * only by this site on this device, and clearing site data removes them. The
 * `track` module stays the only place an analytics provider would ever be
 * wired in, and it is still a no-op.
 *
 * Stored as country codes rather than whole trips because this list feeds the
 * destination field, whose one job is picking a country. Days and usage belong
 * to a trip, not to a place, and offering "Greece, 3 days" where the next tap
 * adds a stop would answer a question the field is not asking.
 *
 * Every read and write is guarded: localStorage throws in a private window,
 * with site data blocked, and inside some in-app browsers. A visitor who has
 * no history, or whose browser refuses to keep one, simply sees the popular
 * destinations — the feature degrades to what was there before rather than
 * taking the field down with it.
 */

const KEY = 'yk.recentDestinations';
export const MAX_RECENT = 5;

function isCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{2}$/.test(value);
}

export function readRecentDestinations(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCode).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** Most recent first, no duplicates, capped. */
export function rememberDestination(code: string): string[] {
  if (!isCode(code)) return readRecentDestinations();
  const next = [code, ...readRecentDestinations().filter((entry) => entry !== code)].slice(
    0,
    MAX_RECENT,
  );
  if (typeof window === 'undefined') return next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // A browser that will not store it still gets the list for this session.
  }
  return next;
}

export function clearRecentDestinations(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do: if it cannot be written it was never stored.
  }
}
