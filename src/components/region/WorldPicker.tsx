'use client';

import { useState } from 'react';
import { HeroSearch } from '@/components/search/HeroSearch';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { RegionPicker, type RegionCard, type RegionCountry } from './RegionPicker';

/**
 * The page across continents works like the other region pages (the owner,
 * 17 October 2026: "choose the places, then get links to the plans"): the
 * trip's countries, and the plans below narrow to the ones covering them all.
 * With every country in the world to choose from they are typed rather than
 * ticked, in the same search as the home page, which asks the days and the
 * use and goes on to the comparison with its links.
 */
export function WorldPicker({
  locale,
  dict,
  inRegion,
  countries,
  cards,
  initialChosen,
  searchPath,
}: {
  locale: Locale;
  dict: Dictionary;
  inRegion: string;
  countries: RegionCountry[];
  cards: RegionCard[];
  /** Countries chosen in the search before this page was (`?to=JP,FR`). */
  initialChosen: string[];
  searchPath: string;
}) {
  const copy = dict.regionPage;
  const [chosen, setChosen] = useState(initialChosen);
  return (
    <>
      <section aria-labelledby="world-search" className="max-w-[80ch] rounded-[20px] border border-line bg-surface p-5 md:p-6">
        <h2 id="world-search" className="font-head text-xl font-semibold text-ink">
          {copy.worldSearchTitle}
        </h2>
        <p className="mt-1 text-ink-2">{copy.worldSearchHint}</p>
        <div className="mt-4">
          <HeroSearch
            locale={locale}
            dict={dict}
            initialProfile={{ destinations: initialChosen.map((countryCode) => ({ countryCode })) }}
            showPopular={false}
            answersTrip={false}
            onDestinationsChange={setChosen}
          />
        </div>
      </section>
      <RegionPicker
        inRegion={inRegion}
        countries={countries}
        cards={cards}
        copy={copy}
        searchPath={searchPath}
        pickable={false}
        chosen={chosen}
      />
    </>
  );
}
