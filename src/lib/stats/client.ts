import type { StatEvent } from './events';

/**
 * The browser's side of the site's own counts: one small message per thing
 * that happened, sent to `/api/e` and not waited for. What the message may
 * say, and what the server keeps of it, are in `./events.ts`.
 *
 * Nothing is stored in the browser for it — no cookie, no storage, no
 * identifier — so there is nothing to ask consent for and nothing to clear. A
 * browser that asks not to be followed (Global Privacy Control, Do Not Track)
 * sends nothing; the server drops such a request too, in case one slips by.
 */
const ENDPOINT = '/api/e';

export function count(event: StatEvent): void {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true || nav.doNotTrack === '1') return;
  try {
    // A string goes as text/plain, which a beacon may carry without asking first.
    const body = JSON.stringify(event);
    if (typeof nav.sendBeacon === 'function' && nav.sendBeacon(ENDPOINT, body)) return;
    void fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // Counting never gets in a visitor's way.
  }
}

/** The referring site's name, never its address: `www.google.com`, not the search. */
export function referrerHost(): string | null {
  try {
    return document.referrer ? new URL(document.referrer).host : null;
  } catch {
    return null;
  }
}
