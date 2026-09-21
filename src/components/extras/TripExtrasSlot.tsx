'use client';

import type { Dictionary } from '@/i18n/getDictionary';
import { CarRentalExtra } from './CarRentalExtra';
import { useTripExtras } from './TripExtrasProvider';

/**
 * Where the offer appears.
 *
 * One slot per page, placed above the results rather than in front of them.
 * Car rental is the only extra today; a second one would be another component
 * rendered here, in a deliberate order, rather than every extra appearing at
 * once — which is the fastest way to turn a useful next step into an advert.
 */
export function TripExtrasSlot({ dict }: { dict: Dictionary }) {
  const extras = useTripExtras();
  if (!extras?.chosenPlanId) return null;

  return (
    <CarRentalExtra
      locale={extras.locale}
      dict={dict}
      countryCode={extras.countryCode}
      tripDays={extras.tripDays}
      planId={extras.chosenPlanId}
    />
  );
}
