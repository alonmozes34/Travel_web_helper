import { getCountryByCode } from '@/data/countries';
import { isLocale, type Locale } from '@/i18n/config';

/**
 * Travellers' reviews (the owner, 15 October 2026: "a name, or stay
 * anonymous, a date and a short text").
 *
 * What a review is, and the only fields it has: the provider, the
 * destination, the month of the trip, whether they would recommend it, a short
 * text, a name if they gave one, and the day it was sent. No email, no IP
 * address, no time finer than the day, nothing about the device: a review is
 * something its writer chose to publish, and nothing else about them is kept
 * with it.
 *
 * Nothing is published until the owner approves it in the dashboard, and no
 * review is ever an input to the comparison: nothing under
 * `src/lib/comparison`, `catalogue`, `sources`, `affiliate` or `src/data`
 * imports this module (`tests/reviews.test.ts`).
 */
export type Review = {
  id: string;
  providerId: string;
  countryCode: string;
  /** `YYYY-MM`. */
  tripMonth: string;
  recommends: boolean;
  text: string;
  /** Null is shown as "anonymous". */
  name: string | null;
  /** `YYYY-MM-DD`, Israel's day. */
  sentOn: string;
  locale: Locale;
};

export const REVIEW_LIMITS = { textMin: 20, text: 600, name: 40 } as const;

/** How far back a trip may be: a review of a trip two years ago says little about today's plan. */
export const TRIP_MONTHS_BACK = 18;

/** The months a trip can be in, newest first: this month and the ones before it. */
export function tripMonths(today: string, count = TRIP_MONTHS_BACK): string[] {
  const [year, month] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1 - i, 1));
    return date.toISOString().slice(0, 7);
  });
}

export type ReviewField = 'provider' | 'country' | 'month' | 'recommends' | 'text' | 'name' | 'consent';
export type ReviewErrors = Partial<Record<ReviewField, 'required' | 'tooLong' | 'tooShort' | 'invalid'>>;
export type ReviewInput = Omit<Review, 'id' | 'sentOn'>;

/**
 * The form's answers, checked against fixed lists: a provider on the site, a
 * real country, a month from the list, yes or no. Only the text and the name
 * are free, and both have a length.
 */
export function validateReview(
  raw: Record<string, unknown>,
  { today, providerIds }: { today: string; providerIds: readonly string[] },
): { ok: true; data: ReviewInput } | { ok: false; errors: ReviewErrors } {
  const text = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string).trim() : '');
  const errors: ReviewErrors = {};

  const providerId = text('provider');
  if (!providerIds.includes(providerId)) errors.provider = 'required';
  const countryCode = text('country').toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode) || !getCountryByCode(countryCode) || countryCode === 'IL') errors.country = 'required';
  const tripMonth = text('month');
  if (!tripMonths(today).includes(tripMonth)) errors.month = 'required';
  const recommends = text('recommends');
  if (recommends !== 'yes' && recommends !== 'no') errors.recommends = 'required';
  // Line breaks kept, runs of blank lines folded: the text is shown as written.
  const body = text('text').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
  if (!body) errors.text = 'required';
  else if (body.length < REVIEW_LIMITS.textMin) errors.text = 'tooShort';
  else if (body.length > REVIEW_LIMITS.text) errors.text = 'tooLong';
  const name = text('name').replace(/\s+/g, ' ');
  if (name.length > REVIEW_LIMITS.name) errors.name = 'tooLong';
  if (text('consent') !== 'yes') errors.consent = 'required';
  const locale = text('locale');

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      providerId,
      countryCode,
      tripMonth,
      recommends: recommends === 'yes',
      text: body,
      name: name || null,
      locale: isLocale(locale) ? locale : 'he',
    },
  };
}

/** A review's id: random, and carries nothing about who sent it. */
export function newReviewId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/** Newest first, by the day sent, then by id so the order is stable. */
export function newestFirst(reviews: readonly Review[]): Review[] {
  return [...reviews].sort((a, b) => b.sentOn.localeCompare(a.sentOn) || a.id.localeCompare(b.id));
}

/** Parses a stored review, or null for anything that is not one. */
export function parseReview(value: unknown): Review | null {
  try {
    const review = (typeof value === 'string' ? JSON.parse(value) : value) as Review;
    if (!review || typeof review !== 'object') return null;
    if (typeof review.id !== 'string' || typeof review.providerId !== 'string' || typeof review.text !== 'string') return null;
    if (typeof review.countryCode !== 'string' || typeof review.tripMonth !== 'string' || typeof review.sentOn !== 'string') return null;
    if (typeof review.recommends !== 'boolean') return null;
    return { ...review, name: typeof review.name === 'string' && review.name ? review.name : null, locale: isLocale(review.locale) ? review.locale : 'he' };
  } catch {
    return null;
  }
}
