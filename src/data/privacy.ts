import { CURRENCY_COOKIE } from '@/i18n/config';
import { PREVIEW_COOKIE } from '@/lib/previewGate';
import { RECENT_DESTINATIONS_KEY } from '@/lib/recentDestinations';
import { TRIP_EXTRAS_KEY } from '@/lib/tripExtras/dismissal';

/**
 * Everything this site puts on a visitor's device.
 *
 * Built from the constants the code actually uses rather than from a list
 * somebody wrote once: a privacy notice that drifts from the software is a
 * false statement, and it drifts the first time a cookie is added and nobody
 * remembers the page. `tests/privacy.test.ts` scans the source for storage
 * keys and fails if one is missing here, so the page cannot quietly become
 * untrue.
 *
 * Note what is absent, and is absent in the code too: no accounts, no
 * payments, no analytics provider, no advertising network, no profiling. The
 * one form that takes personal details is the contact form (since 6 October
 * 2026), which stores nothing and sends one email — see
 * `src/lib/contact/contact.ts` and the "contact form" section of the page.
 * `src/lib/analytics/events.ts` names events and sends none.
 */
export type StorageKind = 'cookie' | 'local' | 'session';

export type StoredItem = {
  key: string;
  kind: StorageKind;
  /** Key into the dictionary, so each entry is explained in both languages. */
  purpose: 'currency' | 'preview' | 'recentDestinations' | 'tripExtras';
  /** True while the item is only written when an optional feature is on. */
  conditional: boolean;
};

export const storedItems: readonly StoredItem[] = [
  { key: CURRENCY_COOKIE, kind: 'cookie', purpose: 'currency', conditional: false },
  // Only written when PREVIEW_GATE is switched on, which it is not.
  { key: PREVIEW_COOKIE, kind: 'cookie', purpose: 'preview', conditional: true },
  { key: RECENT_DESTINATIONS_KEY, kind: 'local', purpose: 'recentDestinations', conditional: false },
  { key: TRIP_EXTRAS_KEY, kind: 'session', purpose: 'tripExtras', conditional: false },
];

/**
 * The date the notice was last checked against the code.
 *
 * Shown on the page. A privacy notice with no date asks to be trusted about
 * software that changes weekly.
 */
export const privacyReviewedOn = '2026-10-06';
