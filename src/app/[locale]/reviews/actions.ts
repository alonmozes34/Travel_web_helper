'use server';

import { headers } from 'next/headers';
import { providers } from '@/data/providers';
import { looksAutomated, rateLimiter } from '@/lib/contact/contact';
import { newReviewId, validateReview, type ReviewErrors } from '@/lib/reviews/reviews';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { israelDay } from '@/lib/stats/store';

export type ReviewState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'invalid'; errors: ReviewErrors; values: Record<string, string> }
  | { status: 'unavailable' | 'rateLimited' | 'full' | 'failed'; values: Record<string, string> };

// Three reviews in ten minutes from one address. The address is held in this
// server's memory for those ten minutes only, and never stored with a review.
const allow = rateLimiter({ count: 3, windowMs: 10 * 60 * 1000 });

const FIELDS = ['provider', 'country', 'month', 'recommends', 'text', 'name', 'consent'];

export async function submitReview(locale: string, _previous: ReviewState, formData: FormData): Promise<ReviewState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([key]) => !key.startsWith('$ACTION')));
  raw.locale = locale;
  const values = Object.fromEntries(FIELDS.map((key) => [key, typeof raw[key] === 'string' ? (raw[key] as string) : '']));
  const now = Date.now();
  const today = israelDay(new Date(now));

  const checked = validateReview(raw, { today, providerIds: providers.map((provider) => provider.id) });
  if (!checked.ok) return { status: 'invalid', errors: checked.errors, values };

  // A script is told "sent", and nothing is kept.
  if (looksAutomated(raw, now)) return { status: 'sent' };

  const store = reviewStoreFromEnv();
  if (!store) return { status: 'unavailable', values };

  const forwarded = (await headers()).get('x-forwarded-for') ?? '';
  if (!allow(forwarded.split(',')[0].trim() || 'unknown', now)) return { status: 'rateLimited', values };

  try {
    const saved = await store.submit({ ...checked.data, id: newReviewId(), sentOn: today });
    return saved === 'full' ? { status: 'full', values } : { status: 'sent' };
  } catch {
    return { status: 'failed', values };
  }
}
