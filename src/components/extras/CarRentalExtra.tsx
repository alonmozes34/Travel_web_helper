'use client';

import { useEffect, useState } from 'react';
import { getCountryByCode } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { track } from '@/lib/analytics/events';
import { bookingLink } from '@/lib/booking/links';
import { declineTripExtra } from '@/lib/tripExtras/dismissal';
import { TripExtraOffer } from './TripExtraOffer';

/**
 * The car-rental cross-sell.
 *
 * It appears only after a traveller has clicked through to an eSIM provider,
 * which is the one moment this site has anything resembling a conversion.
 * That click opens the provider in a new tab, so the comparison stays exactly
 * where it was and this card is simply waiting when they come back — the eSIM
 * journey is never interrupted, delayed, or made conditional on answering.
 *
 * "No thanks" is remembered for the session, so a traveller comparing four
 * plans is asked once rather than four times.
 */
export function CarRentalExtra({
  locale,
  dict,
  countryCode,
  planId,
}: {
  locale: Locale;
  dict: Dictionary;
  /** The first stop of the trip. A multi-stop traveller edits it in the form. */
  countryCode: string | undefined;
  /** Booking's car pages take no dates through the link, so this is unused for now. */
  tripDays: number;
  /** The plan whose click raised this, carried into the events. */
  planId: string;
}) {
  /**
   * Whether it was waved away just now. The *stored* answer is read by the
   * caller before this ever mounts — reading it here would mean setting state
   * from an effect, which cascades a render and is what
   * `react-hooks/set-state-in-effect` exists to stop.
   */
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    track({ name: 'car_rental_offer_shown', countryCode: countryCode ?? '', planId });
  }, [countryCode, planId]);

  /** Booking.com's car pages for the destination (the owner, 6 October 2026). */
  const href = bookingLink('cars', countryCode, locale);
  if (dismissed || !href) return null;

  const country = countryCode ? getCountryByCode(countryCode) : undefined;
  const copy = dict.tripExtras.carRental;

  return (
    <TripExtraOffer
      eyebrow={dict.tripExtras.esimChosen}
      heading={dict.tripExtras.heading}
      question={
        country
          ? interpolate(copy.questionTemplate, { country: country.names[locale] })
          : copy.questionGeneric
      }
      body={copy.body}
      acceptLabel={copy.accept}
      acceptHref={href}
      acceptRel="sponsored noopener noreferrer"
      acceptNote={copy.opensInNewTab}
      declineLabel={copy.decline}
      dismissLabel={copy.dismiss}
      icon="🚗"
      onAccept={() => {
        track({ name: 'car_rental_offer_yes', countryCode: countryCode ?? '', planId });
      }}
      onDecline={() => {
        track({ name: 'car_rental_offer_no', countryCode: countryCode ?? '', planId });
        declineTripExtra('carRental');
        setDismissed(true);
      }}
    />
  );
}
