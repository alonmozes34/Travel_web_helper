/**
 * Whether this visitor has already waved a trip extra away.
 *
 * sessionStorage rather than localStorage: "not this time" is about this
 * visit, and someone planning a different trip next week should be asked
 * again. Nothing is sent anywhere — this is a preference living in one tab's
 * storage, not analytics, and the `track` module remains the only place a
 * provider would ever be wired in.
 *
 * Every access is guarded. Storage throws in a private window, with site data
 * blocked, and inside some in-app browsers; a visitor whose browser refuses
 * simply gets asked again, which is the harmless failure.
 */

const KEY = 'yk.tripExtras.declined';

export type TripExtraKey = 'carRental';

export function isTripExtraDeclined(extra: TripExtraKey): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.includes(extra);
  } catch {
    return false;
  }
}

export function declineTripExtra(extra: TripExtraKey): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
    if (!list.includes(extra)) list.push(extra);
    window.sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // A visitor who cannot be remembered is asked again. That is all.
  }
}
