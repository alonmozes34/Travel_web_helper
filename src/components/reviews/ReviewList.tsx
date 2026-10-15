import { getCountryByCode } from '@/data/countries';
import { getProvider } from '@/data/providers';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { dayLabel, monthLabel } from '@/lib/reviews/format';
import type { Review } from '@/lib/reviews/reviews';

/**
 * Published reviews, as written: the name or "anonymous", whether they would
 * recommend it — in words, not in colour alone — the provider, destination
 * and month of the trip, the text, and the day it was written.
 */
export function ReviewList({
  reviews,
  locale,
  copy,
  empty,
}: {
  reviews: Review[];
  locale: Locale;
  copy: Dictionary['reviewsPage'];
  empty: string;
}) {
  if (reviews.length === 0) return <p className="mt-3 text-ink-2">{empty}</p>;
  return (
    <ul className="mt-4 grid gap-3">
      {reviews.map((review) => (
        <li key={review.id}>
          <article lang={review.locale === locale ? undefined : review.locale} className="min-w-0 rounded-[16px] border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-head text-lg font-semibold [overflow-wrap:anywhere]">{review.name ?? copy.anonymous}</h3>
              <span className={`font-semibold ${review.recommends ? 'text-teal-ink' : 'text-warn-ink'}`}>
                <span aria-hidden="true">{review.recommends ? '👍 ' : '👎 '}</span>
                {review.recommends ? copy.recommends : copy.notRecommends}
              </span>
            </div>
            <p className="mt-1 text-ink-2">
              {interpolate(copy.tripTemplate, {
                provider: getProvider(review.providerId)?.name ?? review.providerId,
                country: getCountryByCode(review.countryCode)?.names[locale] ?? review.countryCode,
                month: monthLabel(review.tripMonth, locale),
              })}
            </p>
            <p className="mt-2 whitespace-pre-line text-ink [overflow-wrap:anywhere]">{review.text}</p>
            <p className="mt-2 text-sm text-ink-3">{interpolate(copy.sentTemplate, { date: dayLabel(review.sentOn) })}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
