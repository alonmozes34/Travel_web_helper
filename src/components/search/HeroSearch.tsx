'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChipLink } from '@/components/ui/Chip';
import { countries, popularCountries, type Country } from '@/data/countries';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { track } from '@/lib/analytics/events';
import { tripProfileToQuery, type TripDestination, type TripProfile } from '@/lib/types/trip';
import { DestinationSearch } from './DestinationSearch';
import { DestinationList } from './DestinationList';
import { TripPersonalization } from './TripPersonalization';

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * The whole first screen asks for one thing: where you are going. More than
 * one stop is allowed, because plenty of trips have them and the plan that
 * suits a two-country trip is often not the plan that suits either country
 * alone.
 *
 * Trip details stay behind a quiet link and never block the journey.
 */
export function HeroSearch({
  locale,
  dict,
  initialProfile = { destinations: [] },
  showPopular = true,
}: {
  locale: Locale;
  dict: Dictionary;
  initialProfile?: TripProfile;
  showPopular?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<TripProfile>(initialProfile);
  const [showDetails, setShowDetails] = useState(Boolean(initialProfile.usage));
  const [error, setError] = useState<string | null>(null);

  /**
   * One stop keeps the shareable, indexable country URL; more than one goes to
   * the multi-stop search, which is the only page that can answer it.
   */
  function hrefFor(next: TripProfile) {
    const query = tripProfileToQuery(next);
    if (next.destinations.length === 1) {
      const country = byCode.get(next.destinations[0].countryCode);
      if (country) return `${localePath(locale, `/esim/${country.slug}`)}${query}`;
    }
    return `${localePath(locale, '/search')}${query}`;
  }

  function addDestination(country: Country) {
    setError(null);
    setProfile((current) =>
      current.destinations.some((d) => d.countryCode === country.code)
        ? current
        : { ...current, destinations: [...current.destinations, { countryCode: country.code }] },
    );
  }

  function setDestinations(destinations: TripDestination[]) {
    setProfile((current) => ({ ...current, destinations }));
  }

  function submit() {
    if (profile.destinations.length === 0) {
      setError(dict.search.chooseFirst);
      return;
    }
    track({
      name: 'search_submitted',
      countryCode: profile.destinations.map((d) => d.countryCode).join('+'),
      days: profile.destinations.reduce((sum, d) => sum + (d.days ?? 0), 0) || undefined,
      usage: profile.usage,
    });
    router.push(hrefFor(profile));
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
          chosen={profile.destinations.map((d) => d.countryCode)}
          onSelect={addDestination}
          placeholder={profile.destinations.length ? dict.search.addAnother : dict.search.placeholder}
        />
        <Button type="submit" className="sm:w-auto">
          {dict.search.submit}
        </Button>
      </div>

      <DestinationList
        destinations={profile.destinations}
        locale={locale}
        dict={dict}
        onChange={setDestinations}
      />

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
            <ChipLink
              key={destination.code}
              href={`${localePath(locale, `/esim/${destination.slug}`)}${tripProfileToQuery({ ...profile, destinations: [{ countryCode: destination.code }] })}`}
            >
              <span aria-hidden="true">{destination.flag}</span>
              {destination.names[locale]}
            </ChipLink>
          ))}
        </div>
      ) : null}
    </form>
  );
}
