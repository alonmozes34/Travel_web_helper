'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { isTripExtraDeclined } from '@/lib/tripExtras/dismissal';

/**
 * The seam the whole "trip extras" idea hangs off.
 *
 * There are two places a traveller can choose an eSIM — a row in the results
 * list, and one leg of a multi-stop combination — and there must be exactly
 * one offer on the page however many of them they click. Holding the chosen
 * plan here rather than in either component is what makes that true, and it
 * is also what lets a server-rendered page put the offer where it belongs:
 * the provider is a client component, the page below it stays a server
 * component, and children pass straight through.
 *
 * Insurance, transfers and attractions are meant to arrive as further slots
 * reading this same context. Nothing about cars appears in this file.
 */

type TripExtrasValue = {
  locale: Locale;
  /** First stop of the trip. A multi-stop traveller edits it in the form. */
  countryCode: string | undefined;
  tripDays: number;
  /** The plan whose outbound click was followed, if any. */
  chosenPlanId: string | null;
  choose: (planId: string) => void;
};

const TripExtrasContext = createContext<TripExtrasValue | null>(null);

/** Null outside a provider, so a component can be used on a page without one. */
export function useTripExtras(): TripExtrasValue | null {
  return useContext(TripExtrasContext);
}

export function TripExtrasProvider({
  locale,
  countryCode,
  tripDays,
  children,
}: {
  locale: Locale;
  countryCode: string | undefined;
  tripDays: number;
  children: ReactNode;
}) {
  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);

  const choose = useCallback((planId: string) => {
    // Read here, inside a click handler, rather than in an effect: session
    // storage is a browser-only fact and this is the first moment it matters.
    // Reading it in an effect would mean setting state from one, which is the
    // cascading render `react-hooks/set-state-in-effect` exists to prevent.
    if (isTripExtraDeclined('carRental')) return;
    setChosenPlanId((current) => current ?? planId);
  }, []);

  const value = useMemo(
    () => ({ locale, countryCode, tripDays, chosenPlanId, choose }),
    [locale, countryCode, tripDays, chosenPlanId, choose],
  );

  return <TripExtrasContext.Provider value={value}>{children}</TripExtrasContext.Provider>;
}
