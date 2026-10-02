'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { getCountryByCode, normalize, popularCountries, searchCountries, type Country } from '@/data/countries';
import type { PlaceMatch } from '@/lib/places/searchPlaces';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { track } from '@/lib/analytics/events';
import { readRecentDestinations, rememberDestination } from '@/lib/recentDestinations';

/**
 * Destination combobox.
 *
 * One field, one job. Matching runs over Hebrew names, English names and
 * aliases at once, because Israeli travellers type "תאילנד", "thailand" and
 * "בנגקוק" interchangeably.
 *
 * Tapping the field opens a list before anything is typed: the places this
 * visitor searched for before, then the popular ones. An empty box that
 * answers nothing until you guess a spelling puts the whole burden of the
 * first move on the traveller, and on a phone it is a keyboard covering half
 * the screen for a country the list could have offered in one tap.
 *
 * Cities too (the owner, 2 October 2026): after two letters the server is
 * asked for cities by that name (`/api/places`, from GeoNames), shown under
 * the countries as "נאפולי · 🇮🇹 איטליה". Picking one picks its country —
 * eSIMs are sold by country. A city in Israel gets a word instead of a row:
 * at home there is nothing to buy.
 */
export function DestinationSearch({
  locale,
  dict,
  chosen,
  onSelect,
  placeholder,
  autoFocus = false,
  onOpenChange,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Country codes already on the trip, so they are not offered twice. */
  chosen: string[];
  onSelect: (country: Country) => void;
  placeholder: string;
  autoFocus?: boolean;
  /** Told whenever the popup opens or closes, so the page can clear its way. */
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Read when the field is opened, never during render: localStorage does not
  // exist on the server, so a list built during render would differ between
  // the two and break hydration. Reading on focus also means a search stored
  // in another tab, or on an earlier visit, is there without a reload.
  const [recentCodes, setRecentCodes] = useState<string[]>([]);

  // Destinations already on the trip are filtered out rather than shown and
  // silently ignored when picked.
  const matches = useMemo(
    () =>
      query.trim()
        ? searchCountries(query, locale).filter((country) => !chosen.includes(country.code))
        : [],
    [query, locale, chosen],
  );

  // City matches for the current query, fetched after a short pause. Kept
  // with the query they answer, so a slow answer to an old query is ignored.
  const [placeAnswer, setPlaceAnswer] = useState<{ query: string; places: PlaceMatch[] } | null>(null);
  const trimmedQuery = query.trim();
  useEffect(() => {
    if (normalize(trimmedQuery).length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(trimmedQuery)}&locale=${locale}`, { signal: controller.signal })
        .then((response) => (response.ok ? (response.json() as Promise<PlaceMatch[]>) : []))
        .then((places) => setPlaceAnswer({ query: trimmedQuery, places }))
        .catch(() => {});
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, locale]);
  const placesReady = placeAnswer?.query === trimmedQuery || normalize(trimmedQuery).length < 2;
  const answeredPlaces = useMemo(
    () => (placeAnswer?.query === trimmedQuery ? placeAnswer.places : []),
    [placeAnswer, trimmedQuery],
  );

  /** Cities to offer: not already a country row, not on the trip, and not at home. */
  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ place: string; country: Country }> = [];
    for (const place of answeredPlaces) {
      const country = getCountryByCode(place.countryCode);
      if (!country || country.code === 'IL' || chosen.includes(country.code)) continue;
      const key = `${normalize(place.name)}|${country.code}`;
      const sameAsCountry = [country.names.he, country.names.en].some((name) => normalize(name) === normalize(place.name));
      if (seen.has(key) || sameAsCountry) continue;
      seen.add(key);
      out.push({ place: place.name, country });
    }
    // Fewer under a list of countries, so the popup stays a phone screen tall.
    return out.slice(0, matches.length ? 3 : 5);
  }, [answeredPlaces, chosen, matches.length]);
  /** A city in Israel, when that is all the query found. */
  const placeAtHome = answeredPlaces.find((place) => place.countryCode === 'IL')?.name ?? null;

  /**
   * What an untyped field offers: where this visitor has been before, then the
   * popular list, with nothing repeated between the two and nothing already on
   * the trip.
   */
  const sections = useMemo(() => {
    const recent = recentCodes
      .map((code) => getCountryByCode(code))
      .filter((country): country is Country => Boolean(country))
      .filter((country) => !chosen.includes(country.code));
    const recentCodeSet = new Set(recent.map((country) => country.code));
    const popular = popularCountries.filter(
      (country) => !chosen.includes(country.code) && !recentCodeSet.has(country.code),
    );

    let offset = 0;
    return [
      { key: 'recent' as const, label: dict.search.recentLabel, countries: recent },
      { key: 'popular' as const, label: dict.search.popularGroupLabel, countries: popular },
    ]
      .filter((section) => section.countries.length > 0)
      .map((section) => {
        // Indexed against the flat list the arrow keys walk, so the row the
        // keyboard highlights is the row the mouse would.
        const items = section.countries.map((country, index) => ({
          country,
          index: offset + index,
        }));
        offset += items.length;
        return { ...section, items };
      });
  }, [recentCodes, chosen, dict]);

  const isTyping = query.trim().length > 0;
  /** One flat list in the order they are rendered, so the arrow keys agree. */
  const options = isTyping
    ? [...matches, ...cityOptions.map((option) => option.country)]
    : sections.flatMap((section) => section.items.map((item) => item.country));
  const showList = open && (isTyping || options.length > 0);
  /**
   * A listbox has to contain options. When a query matches nothing the popup
   * is a message, not a list, so it is not announced as one and the combobox
   * is not expanded onto it — an empty listbox told a screen-reader user there
   * were results to move through and then gave them nowhere to go.
   */
  const showListbox = showList && options.length > 0;

  // Reported during render rather than from an effect, and only on a change,
  // so the parent never re-renders in a loop.
  const [reportedOpen, setReportedOpen] = useState(false);
  if (reportedOpen !== showList) {
    setReportedOpen(showList);
    onOpenChange?.(showList);
  }

  // The field empties after each pick, so the next stop can be typed straight
  // away; the chosen stops live in the list below it.
  function commit(country: Country) {
    // Local only. See src/lib/recentDestinations.ts — nothing leaves the device.
    setRecentCodes(rememberDestination(country.code));
    onSelect(country);
    setQuery('');
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function clear() {
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    setActiveIndex(0);

    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      track({
        name: 'destination_search',
        query: trimmed,
        resultCount: searchCountries(trimmed, locale).length,
      });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showList || options.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(options[activeIndex]);
    }
  }

  return (
    /* Not the positioning context: the popup is anchored to the whole search
       bar by the parent, so it spans its full width and sits clear of the
       controls beneath it. Anchored to this field alone it stopped 9px short
       of the trip-details link and left a sliver of it showing out from under
       an overlay — a target you can only hit by accident. */
    <div className="flex-1">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        {dict.search.label}
      </label>

      <div className="flex min-h-12 items-center gap-2.5 px-3.5">
        <span aria-hidden="true" className="text-ink-3">
          📍
        </span>

        <input
          id={`${listboxId}-input`}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          autoFocus={autoFocus}
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showListbox ? optionId(activeIndex) : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setRecentCodes(readRecentDestinations());
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-ink-3"
        />

        {query ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex size-9 items-center justify-center rounded-sm text-ink-3 hover:bg-surface-2"
          >
            <span aria-hidden="true">✕</span>
            <span className="sr-only">{dict.search.clear}</span>
          </button>
        ) : null}
      </div>

      {showList && !showListbox && placesReady ? (
        <p
          role="status"
          className="absolute -inset-x-px top-[calc(100%+0.75rem)] z-30 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-2 shadow-search"
        >
          {placeAtHome ? dict.search.placeInIsraelTemplate.replace('{place}', placeAtHome) : dict.search.noResults}
        </p>
      ) : null}

      {showListbox ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={dict.search.suggestionsLabel}
          className="absolute -inset-x-px top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-search"
        >
          {isTyping ? (
            <>
              {(() => {
                const rows = matches.map((country, index) => (
                  <Option
                    key={country.code}
                    country={country}
                    locale={locale}
                    id={optionId(index)}
                    isActive={index === activeIndex}
                    onHover={() => setActiveIndex(index)}
                    onPick={() => commit(country)}
                  />
                ));
                // Labelled only when cities follow, so a plain country
                // search reads exactly as before.
                return matches.length && cityOptions.length ? (
                  <div role="group" aria-labelledby={`${listboxId}-countries`}>
                    <p id={`${listboxId}-countries`} className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-3">
                      {dict.search.countriesLabel}
                    </p>
                    {rows}
                  </div>
                ) : (
                  rows
                );
              })()}
              {cityOptions.length ? (
                <div role="group" aria-labelledby={`${listboxId}-cities`}>
                  <p id={`${listboxId}-cities`} className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-3">
                    {dict.search.citiesLabel}
                  </p>
                  {cityOptions.map(({ place, country }, cityIndex) => {
                    const index = matches.length + cityIndex;
                    return (
                      <Option
                        key={`${place}-${country.code}`}
                        country={country}
                        place={place}
                        locale={locale}
                        id={optionId(index)}
                        isActive={index === activeIndex}
                        onHover={() => setActiveIndex(index)}
                        onPick={() => commit(country)}
                      />
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            /* `listbox > group > option` rather than a flat list with a
               heading in it: a section title is not something you can choose,
               and rendering it as one more option is how a keyboard lands on a
               row that does nothing. */
            sections.map((section) => (
              <Group
                key={section.key}
                section={section}
                headingId={`${listboxId}-${section.key}`}
                locale={locale}
                optionId={optionId}
                activeIndex={activeIndex}
                onHover={setActiveIndex}
                onPick={commit}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function Option({
  country,
  place,
  locale,
  id,
  isActive,
  onHover,
  onPick,
}: {
  country: Country;
  /** A city in that country, when the row offers the country through it. */
  place?: string;
  locale: Locale;
  id: string;
  isActive: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={isActive}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onHover}
      onClick={onPick}
      className={`flex min-h-12 w-full items-center gap-3 px-4 text-start text-base ${
        isActive ? 'bg-brand-50' : 'bg-surface'
      }`}
    >
      {place ? (
        <>
          <span aria-hidden="true">📍</span>
          <span className="font-semibold">{place}</span>
          <span className="text-sm text-ink-2">
            <span className="sr-only">, </span>
            <span aria-hidden="true">· {country.flag} </span>
            {country.names[locale]}
          </span>
        </>
      ) : (
        <>
          <span aria-hidden="true">{country.flag}</span>
          <span className="font-semibold">{country.names[locale]}</span>
          <span className="text-sm text-ink-3">{country.names.en}</span>
        </>
      )}
    </button>
  );
}

/** One labelled section of the untyped list: recent searches, or popular. */
function Group({
  section,
  headingId,
  locale,
  optionId,
  activeIndex,
  onHover,
  onPick,
}: {
  section: { label: string; items: { country: Country; index: number }[] };
  headingId: string;
  locale: Locale;
  optionId: (index: number) => string;
  activeIndex: number;
  onHover: (index: number) => void;
  onPick: (country: Country) => void;
}) {
  return (
    <div role="group" aria-labelledby={headingId}>
      <p
        id={headingId}
        className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-3"
      >
        {section.label}
      </p>
      {section.items.map(({ country, index }) => (
        <Option
          key={country.code}
          country={country}
          locale={locale}
          id={optionId(index)}
          isActive={index === activeIndex}
          onHover={() => onHover(index)}
          onPick={() => onPick(country)}
        />
      ))}
    </div>
  );
}
