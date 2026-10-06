'use client';

import { useEffect, useState } from 'react';
import { BookingLogo } from '@/components/booking/BookingLogo';
import { getCountryByCode } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { track } from '@/lib/analytics/events';
import { bookingLink } from '@/lib/booking/links';
import { declineTripExtra } from '@/lib/tripExtras/dismissal';

/**
 * Hotels and a rental car on Booking.com, offered the moment an eSIM is
 * chosen (the owner, 6 October 2026: "simple and prominent, with Booking's
 * logo").
 *
 * It appears only after a traveller has clicked through to an eSIM provider.
 * That click opens the provider in a new tab, so this card is waiting when
 * they come back, and the comparison behind it is exactly where they left it.
 * A card in the page rather than a dialog: it takes no focus and covers
 * nothing, so it can never stand in front of the eSIM they came for.
 *
 * "No thanks" is remembered for the session, so a traveller comparing four
 * plans is asked once rather than four times.
 */
export function BookingExtra({
  locale,
  dict,
  countryCode,
  planId,
}: {
  locale: Locale;
  dict: Dictionary;
  /** The first stop of the trip. A multi-stop traveller edits it in the form. */
  countryCode: string | undefined;
  /** The plan whose click raised this, carried into the events. */
  planId: string;
}) {
  /**
   * Whether it was waved away just now. The *stored* answer is read by the
   * caller before this ever mounts — reading it here would mean setting state
   * from an effect, which `react-hooks/set-state-in-effect` exists to stop.
   */
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    track({ name: 'car_rental_offer_shown', countryCode: countryCode ?? '', planId });
  }, [countryCode, planId]);

  const country = countryCode ? getCountryByCode(countryCode) : undefined;
  const hotels = bookingLink('hotels', countryCode, locale);
  const cars = bookingLink('cars', countryCode, locale);
  if (dismissed || !country || !hotels || !cars) return null;

  const copy = dict.tripExtras.booking;
  const name = country.names[locale];
  const decline = () => {
    track({ name: 'car_rental_offer_no', countryCode: country.code, planId });
    declineTripExtra('carRental');
    setDismissed(true);
  };
  const links = [
    { kind: 'hotels', icon: '🏨', href: hotels, label: interpolate(copy.hotelsTemplate, { country: name }) },
    { kind: 'cars', icon: '🚗', href: cars, label: interpolate(copy.carsTemplate, { country: name }) },
  ];

  return (
    <section
      aria-labelledby="booking-extra-title"
      className="on-night bg-night-band trip-extra-in relative mb-6 rounded-[20px] p-5 text-on-night shadow-lg md:p-6"
    >
      <button
        type="button"
        onClick={decline}
        className="absolute end-2 top-2 inline-flex size-11 items-center justify-center rounded-sm text-on-night-2 hover:bg-white/10"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ✕
        </span>
        <span className="sr-only">{copy.dismiss}</span>
      </button>

      <p className="text-sm font-semibold text-on-night-2">
        <span aria-hidden="true">✓ </span>
        {dict.tripExtras.esimChosen}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3 pe-10">
        <h2 id="booking-extra-title" className="font-head text-xl font-semibold md:text-2xl">
          {interpolate(copy.questionTemplate, { country: name })}
        </h2>
        <BookingLogo />
      </div>
      <p className="mt-2 max-w-[60ch] text-on-night-2">{copy.body}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.kind} className="min-w-0">
            <a
              href={link.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() => track({ name: 'car_rental_offer_yes', countryCode: country.code, planId })}
              className="flex min-h-14 items-center justify-center gap-3 rounded-[14px] bg-white px-4 py-3 text-center text-lg font-semibold text-night transition-transform hover:-translate-y-0.5 [overflow-wrap:anywhere]"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {link.icon}
              </span>
              {link.label}
              <span className="sr-only"> {copy.opensInNewTab}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-on-night-2">
          {copy.opensInNewTab} {dict.booking.disclosure}
        </p>
        <button
          type="button"
          onClick={decline}
          className="min-h-11 rounded-sm px-2 text-sm font-semibold text-on-night underline underline-offset-4"
        >
          {copy.decline}
        </button>
      </div>
    </section>
  );
}
