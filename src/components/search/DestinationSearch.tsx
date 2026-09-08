'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { searchCountries, type Country } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { track } from '@/lib/analytics/events';

/**
 * Destination combobox.
 *
 * One field, one job. Matching runs over Hebrew names, English names and
 * aliases at once, because Israeli travellers type "תאילנד", "thailand" and
 * "בנגקוק" interchangeably.
 */
export function DestinationSearch({
  locale,
  dict,
  chosen,
  onSelect,
  placeholder,
  autoFocus = false,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Country codes already on the trip, so they are not offered twice. */
  chosen: string[];
  onSelect: (country: Country) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Destinations already on the trip are filtered out rather than shown and
  // silently ignored when picked.
  const matches = useMemo(
    () =>
      query.trim()
        ? searchCountries(query, locale).filter((country) => !chosen.includes(country.code))
        : [],
    [query, locale, chosen],
  );

  const showList = open && query.trim().length > 0;

  // The field empties after each pick, so the next stop can be typed straight
  // away; the chosen stops live in the list below it.
  function commit(country: Country) {
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
    if (!showList || matches.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(matches[activeIndex]);
    }
  }

  return (
    <div className="relative flex-1">
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
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && matches.length > 0 ? optionId(activeIndex) : undefined
          }
          value={query}
          placeholder={placeholder}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
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

      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={dict.search.suggestionsLabel}
          className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-md border border-line bg-surface shadow-search"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-[0.8125rem] text-ink-2">{dict.search.noResults}</li>
          ) : (
            matches.map((country, index) => (
              <li key={country.code}>
                <button
                  type="button"
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(country)}
                  className={`flex w-full min-h-12 items-center gap-3 px-4 text-start text-[0.9375rem] ${
                    index === activeIndex ? 'bg-brand-50' : 'bg-surface'
                  }`}
                >
                  <span aria-hidden="true">{country.flag}</span>
                  <span className="font-semibold">{country.names[locale]}</span>
                  <span className="text-[0.8125rem] text-ink-3">{country.names.en}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
