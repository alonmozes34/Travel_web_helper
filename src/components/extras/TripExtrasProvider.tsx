'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';

/**
 * The seam the whole "trip extras" idea hangs off.
 *
 * There are two places a traveller can choose an eSIM — a row in the results
 * list, and one leg of a multi-stop combination. Holding the chosen plan here
 * rather than in either component is what lets the Booking.com planner at the
 * bottom of the page (`BookingPlanner`) come into view once, when the
 * traveller is back from the plan's tab, however many plans they clicked; and
 * what lets a server-rendered page put it where it belongs: the provider is a
 * client component, the page below it stays a server component, and children
 * pass straight through.
 */

type TripExtrasValue = {
  locale: Locale;
  /** First stop of the trip. A multi-stop traveller edits it in the form. */
  countryCode: string | undefined;
  tripDays: number;
  /** The plan whose outbound click was followed, if any. */
  chosenPlanId: string | null;
  /** Whether a real rental network is connected, so the car question may be asked. */
  carRentalOffer: boolean;
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
  carRentalOffer,
  children,
}: {
  locale: Locale;
  countryCode: string | undefined;
  tripDays: number;
  carRentalOffer: boolean;
  children: ReactNode;
}) {
  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);

  const choose = useCallback((planId: string) => {
    if (!carRentalOffer) return;
    setChosenPlanId((current) => current ?? planId);
  }, [carRentalOffer]);

  const value = useMemo(
    () => ({ locale, countryCode, tripDays, chosenPlanId, carRentalOffer, choose }),
    [locale, countryCode, tripDays, chosenPlanId, carRentalOffer, choose],
  );

  return <TripExtrasContext.Provider value={value}>{children}</TripExtrasContext.Provider>;
}
