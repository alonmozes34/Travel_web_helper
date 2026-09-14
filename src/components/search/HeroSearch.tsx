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
  sameTrip,
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
  const [listOpen, setListOpen] = useState(false);

  /**
   * Adopt the page's trip when the page changes under us.
   *
   * Navigating from /search to /search keeps this component mounted, so the
   * form went on holding the trip the visitor had just cleared — and the empty
   * search page greeted them with "you changed the trip" and a button that
   * would have done nothing. Adjusting state during render rather than in an
   * effect, which is React's own answer to a prop the state derives from, and
   * avoids a frame of the wrong thing.
   */
  const [seededFrom, setSeededFrom] = useState(initialProfile);
  if (!sameTrip(seededFrom, initialProfile)) {
    setSeededFrom(initialProfile);
    setProfile(initialProfile);
  }

  /**
   * Removing the last stop is not an edit waiting to be applied. It says the
   * results answer nothing any more, and offering "update the results" for it
   * asks the visitor to confirm a deletion they have already made — so this
   * case clears the page itself, in `setDestinations`, and never raises the
   * bar below.
   */
  const isClearingTrip =
    profile.destinations.length === 0 && initialProfile.destinations.length > 0;

  /**
   * The trip in this form against the one the page was rendered for. Anything
   * but equal means the results on screen answer a question the visitor has
   * already changed.
   *
   * Only where there are results to be stale. On the home page nothing has
   * been searched for yet, so "the results below still show the previous
   * search" described a list that does not exist, and put a third submit
   * button on a form that already had two.
   */
  const hasPendingChanges =
    initialProfile.destinations.length > 0 &&
    !isClearingTrip &&
    !sameTrip(profile, initialProfile);

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
    const next = { ...profile, destinations };
    setProfile(next);

    // The empty search is where "I no longer want these results" lands, and it
    // goes there at once rather than behind a button. What the traveller told
    // us about the trip goes with it: the days belonged to the stops and are
    // gone with them, but how the connection will be used, or the GB figure
    // they typed, is still their answer — dropping it would make clearing the
    // map silently reset the questionnaire too.
    if (destinations.length === 0 && initialProfile.destinations.length > 0) {
      setError(null);
      router.push(`${localePath(locale, "/search")}${tripProfileToQuery(next)}`);
    }
  }

  function submit() {
    // Clearing the trip is an instruction, not an incomplete form. Someone who
    // removes their last destination has said the results no longer answer
    // anything, and refusing with "choose a destination" left them stranded on
    // a page still showing the country they had just deleted — the heading,
    // the flag and every plan. The empty search is where that request lands.
    if (profile.destinations.length === 0 && initialProfile.destinations.length > 0) {
      router.push(`${localePath(locale, "/search")}${tripProfileToQuery(profile)}`);
      return;
    }

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
        <div className="relative flex max-w-[640px] flex-col gap-2 rounded-lg border border-line bg-surface p-2 shadow-search sm:flex-row sm:items-stretch">
          <DestinationSearch
            locale={locale}
            dict={dict}
            chosen={profile.destinations.map((d) => d.countryCode)}
            onSelect={addDestination}
            onOpenChange={setListOpen}
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
        /* Kept in the flow but taken out of reach while the destination list
           is open: the popup covers this row, and half a chip showing from
           under an overlay is a target you can only hit by mistake. The list
           offers the same destinations while it is open, so nothing is lost —
           and `invisible` rather than `hidden` keeps the page from jumping. */
        <div
          className={`mt-4 flex flex-wrap items-center gap-2${listOpen ? " invisible" : ""}`}
        >
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

      {/* An edit that produces no visible consequence reads as a broken site,
          whatever happens later. Removing a destination changed local state
          only: the heading, the flag and the plans are rendered on the server
          from the URL, so the page sat there unchanged — and the button that
          would have applied it lives inside the collapsed panel below, so a
          visitor who had not opened that panel had no way to apply it at all.

          Everything in this form is edit-then-apply, including the days and
          the usage, so the fix is not to navigate on one of them: it is to say
          plainly that there are changes waiting, and to put the button that
          applies them where the change was made. */}
      {hasPendingChanges ? (
        <div
          role="status"
          className="mt-3 flex max-w-[640px] flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border-s-[3px] border-s-brand bg-brand-50 px-3 py-2.5"
        >
          <p className="text-sm font-semibold text-ink">{dict.search.pendingTitle}</p>
          <Button type="submit" size="sm" className="ms-auto">
            {dict.search.pendingApply}
          </Button>
        </div>
      ) : null}

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

          {/* The last answer in this panel is a number typed into a field,
              and a typed number with no button under it is a form that looks
              unfinished — the only way on was a button above the panel, out of
              sight once the panel is open on a phone. So the panel carries its
              own, on every variant: on the compact one it is the only submit
              there is, and on the hero it is the one that sits where the
              answering happens. */}
          <Button type="submit" className="mt-3 w-full sm:w-auto">
            {dict.personalization.submit}
          </Button>
        </div>
      ) : null}

    </form>
  );
}
