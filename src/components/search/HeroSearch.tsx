"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChipLink } from "@/components/ui/Chip";
import { countries, popularCountries, type Country } from "@/data/countries";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { track } from "@/lib/analytics/events";
import {
  isTripDescribed,
  missingTripFields,
  tripProfileToQuery,
  type TripDestination,
  type TripProfile,
} from "@/lib/types/trip";
import { DestinationSearch } from "./DestinationSearch";
import { DestinationList } from "./DestinationList";
import { TripPersonalization } from "./TripPersonalization";

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
  variant = "hero",
}: {
  locale: Locale;
  dict: Dictionary;
  initialProfile?: TripProfile;
  showPopular?: boolean;
  /**
   * 'compact' is for a page that already has a destination. A large empty
   * search box and a primary-coloured button above results the traveller has
   * already asked for is not a search — it is 230px of the screen spent
   * telling them to do what they have done. The box stays one tap away.
   */
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<TripProfile>(initialProfile);
  // Open whenever the trip is not yet described — including a visitor who
  // landed on a destination page straight from a search engine, who has told
  // us nothing and would otherwise be shown a recommendation built on two
  // defaults they never chose.
  const [showDetails, setShowDetails] = useState(
    initialProfile.destinations.length > 0 && !isTripDescribed(initialProfile),
  );
  const [showSearch, setShowSearch] = useState(variant === "hero");
  const [error, setError] = useState<string | null>(null);

  /**
   * One stop keeps the shareable, indexable country URL; more than one goes to
   * the multi-stop search, which is the only page that can answer it.
   */
  function hrefFor(next: TripProfile) {
    const query = tripProfileToQuery(next);
    if (next.destinations.length === 1) {
      const country = byCode.get(next.destinations[0].countryCode);
      if (country)
        return `${localePath(locale, `/esim/${country.slug}`)}${query}`;
    }
    return `${localePath(locale, "/search")}${query}`;
  }

  /**
   * Choosing a destination does not run the search. The days and the usage
   * decide which plan fits — a fortnight of video and a weekend of navigation
   * want different packages at the same destination — so picking a country
   * opens those two questions instead of skipping past them.
   */
  function addDestination(country: Country) {
    setError(null);
    setShowDetails(true);
    setProfile((current) =>
      current.destinations.some((d) => d.countryCode === country.code)
        ? current
        : {
            ...current,
            destinations: [
              ...current.destinations,
              { countryCode: country.code },
            ],
          },
    );
  }

  function setDestinations(destinations: TripDestination[]) {
    setProfile((current) => ({ ...current, destinations }));
  }

  function submit() {
    // Say which answer is missing rather than refusing without a reason.
    const missing = missingTripFields(profile);
    if (missing.length > 0) {
      setShowDetails(true);
      setError(
        missing
          .map((field) =>
            field === "destination"
              ? dict.personalization.missingDestination
              : field === "days"
                ? dict.personalization.missingDays
                : dict.personalization.missingUsage,
          )
          .join(" · "),
      );
      return;
    }
    track({
      name: "search_submitted",
      countryCode: profile.destinations.map((d) => d.countryCode).join("+"),
      days:
        profile.destinations.reduce((sum, d) => sum + (d.days ?? 0), 0) ||
        undefined,
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
      {showSearch ? (
        <div className="flex max-w-[640px] flex-col gap-2 rounded-lg border border-line bg-surface p-2 shadow-search sm:flex-row sm:items-stretch">
          <DestinationSearch
            locale={locale}
            dict={dict}
            chosen={profile.destinations.map((d) => d.countryCode)}
            onSelect={addDestination}
            placeholder={
              profile.destinations.length
                ? dict.search.addAnother
                : dict.search.placeholder
            }
          />
          <Button type="submit" className="sm:w-auto">
            {dict.search.submit}
          </Button>
        </div>
      ) : null}

      {/* The shortcuts sit with the search box, above the trip questions:
          where you are going comes before how long and what for, and a list of
          destinations pushed below the questionnaire reads as an afterthought
          rather than as the fastest way in. */}
      {showPopular ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-3">{dict.search.popularLabel}</span>
          {/* Still real links, so the destination pages stay crawlable and
              openable in a new tab — but a click here fills the trip in place
              and asks the two questions, like any other way of choosing. */}
          {popularCountries.map((destination) => (
            <ChipLink
              key={destination.code}
              href={`${localePath(locale, `/esim/${destination.slug}`)}${tripProfileToQuery({ ...profile, destinations: [{ countryCode: destination.code }] })}`}
              onClick={(event) => {
                event.preventDefault();
                addDestination(destination);
              }}
            >
              <span aria-hidden="true">{destination.flag}</span>
              {destination.names[locale]}
            </ChipLink>
          ))}
        </div>
      ) : null}
      <DestinationList
        destinations={profile.destinations}
        locale={locale}
        dict={dict}
        onChange={setDestinations}
      />

      <p aria-live="polite" className="min-h-5 pt-2 text-sm text-warn-ink">
        {error}
      </p>

      <div className="flex max-w-[640px] flex-wrap items-center gap-x-5 gap-y-2">
        {showSearch ? null : (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand"
          >
            {dict.search.addAnother}
            <span aria-hidden="true">›</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          aria-expanded={showDetails}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand"
        >
          {dict.personalization.trigger}
          <span aria-hidden="true">{showDetails ? "⌃" : "›"}</span>
        </button>
        <span className="text-sm text-ink-2">
          {dict.personalization.optional}
        </span>
      </div>

      {showDetails ? (
        <div className="mt-3 max-w-[640px]">
          <TripPersonalization
            dict={dict}
            locale={locale}
            profile={profile}
            onChange={(next) => {
              setError(null);
              setProfile(next);
            }}
          />
        </div>
      ) : null}

    </form>
  );
}
