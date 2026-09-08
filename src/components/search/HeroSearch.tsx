'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChipLink } from '@/components/ui/Chip';
import { popularCountries, type Country } from '@/data/countries';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { track } from '@/lib/analytics/events';
import { tripProfileToQuery, type TripProfile } from '@/lib/types/trip';
import { DestinationSearch } from './DestinationSearch';
import { TripPersonalization } from './TripPersonalization';

/**
 * The whole first screen asks for one thing: a destination.
 *
 * Trip details sit behind a quiet link and never block the journey — pressing
 * "Compare eSIMs" with nothing but a country goes straight to results.
 */
export function HeroSearch({
  locale,
  dict,
  initialCountry = null,
  initialProfile = {},
  showPopular = true,
}: {
  locale: Locale;
  dict: Dictionary;
  initialCountry?: Country | null;
  initialProfile?: TripProfile;
  showPopular?: boolean;
}) {
  const router = useRouter();
  const [country, setCountry] = useState<Country | null>(initialCountry);
  const [profile, setProfile] = useState<TripProfile>(initialProfile);
  const [showDetails, setShowDetails] = useState(
    Boolean(initialProfile.days || initialProfile.usage),
  );
  const [error, setError] = useState<string | null>(null);

  function countryHref(target: Country) {
    return `${localePath(locale, `/esim/${target.slug}`)}${tripProfileToQuery(profile)}`;
  }

  function submit() {
    if (!country) {
      setError(dict.search.chooseFirst);
      return;
    }
    track({
      name: 'search_submitted',
      countryCode: country.code,
      days: profile.days,
      usage: profile.usage,
    });
    router.push(countryHref(country));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="flex max-w-[640px] flex-col gap-2 rounded-lg border border-line bg-surface p-2 shadow-search sm:flex-row sm:items-stretch">
        <DestinationSearch
          locale={locale}
          dict={dict}
          selected={country}
          onSelect={(next) => {
            setCountry(next);
            setError(null);
          }}
        />
        <Button type="submit" className="sm:w-auto">
          {dict.search.submit}
        </Button>
      </div>

      <p aria-live="polite" className="min-h-5 pt-2 text-[0.8125rem] text-warn-ink">
        {error}
      </p>

      <div className="flex max-w-[640px] flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={showDetails}
          className="inline-flex items-center gap-1.5 font-semibold text-brand"
        >
          {dict.personalization.trigger}
          <span aria-hidden="true">{showDetails ? '⌃' : '›'}</span>
        </button>
        <span className="text-[0.8125rem] text-ink-3">{dict.personalization.optional}</span>
      </div>

      {showDetails ? (
        <div className="mt-3 max-w-[640px]">
          <TripPersonalization dict={dict} profile={profile} onChange={setProfile} />
        </div>
      ) : null}

      {showPopular ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[0.8125rem] text-ink-3">{dict.search.popularLabel}</span>
          {popularCountries.map((destination) => (
            <ChipLink key={destination.code} href={countryHref(destination)}>
              <span aria-hidden="true">{destination.flag}</span>
              {destination.names[locale]}
            </ChipLink>
          ))}
        </div>
      ) : null}
    </form>
  );
}
