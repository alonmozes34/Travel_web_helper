'use client';

import { Ltr } from '@/components/ui/Bdi';
import { getCountryBySlug, countries } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { TripDestination } from '@/lib/types/trip';

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * The stops on the trip, each with its own length.
 *
 * Days sit on the destination rather than on the trip because a night in
 * Germany and a fortnight in the States are different purchases; sizing both
 * from one total would over-buy for the short stop and make any combination
 * look more expensive than it is.
 */
export function DestinationList({
  destinations,
  locale,
  dict,
  onChange,
}: {
  destinations: TripDestination[];
  locale: Locale;
  dict: Dictionary;
  onChange: (destinations: TripDestination[]) => void;
}) {
  if (destinations.length === 0) return null;

  const anyMissingDays = destinations.some((destination) => destination.days === undefined);

  return (
    <>
    <ul className="mt-3 flex max-w-[640px] flex-wrap gap-2">
      {destinations.map((destination, index) => {
        const country = byCode.get(destination.countryCode);
        const name = country?.names[locale] ?? destination.countryCode;

        return (
          <li
            key={destination.countryCode}
            className="flex min-h-12 items-center gap-2 rounded-full border border-line bg-surface ps-3 pe-1.5"
          >
            <span aria-hidden="true">{country?.flag}</span>
            <span className="text-base font-semibold">{name}</span>

            {/* The label was screen-reader-only and the field showed a bare
                dash, so a sighted first-time visitor saw an empty box with no
                idea what to type into it. */}
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <span className="sr-only">
                {interpolate(dict.search.daysLabelTemplate, { country: name })}
              </span>
              <span aria-hidden="true">{dict.search.daysFieldLabel}</span>
              <input
                type="number"
                min={1}
                max={365}
                inputMode="numeric"
                value={destination.days ?? ''}
                placeholder={dict.search.daysPlaceholder}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  const next = [...destinations];
                  next[index] = {
                    ...destination,
                    days: Number.isFinite(value) && value > 0 ? Math.min(365, value) : undefined,
                  };
                  onChange(next);
                }}
                className="tnum h-11 w-14 rounded-sm border border-line bg-surface px-1.5 text-center text-base text-ink"
              />
              <Ltr>{dict.search.daysUnit}</Ltr>
            </label>

            <button
              type="button"
              onClick={() => onChange(destinations.filter((_, i) => i !== index))}
              className="inline-flex size-11 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2"
            >
              <span aria-hidden="true">✕</span>
              <span className="sr-only">{interpolate(dict.search.removeTemplate, { country: name })}</span>
            </button>
          </li>
        );
      })}
    </ul>
    {anyMissingDays ? (
      <p className="mt-2 max-w-[640px] text-sm text-ink-3">{dict.search.daysHint}</p>
    ) : null}
    </>
  );
}

export { getCountryBySlug };
