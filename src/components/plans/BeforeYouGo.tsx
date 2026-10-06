'use client';

import { useEffect, useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useTripExtras } from '@/components/extras/TripExtrasProvider';
import { getCountryByCode } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { OutboundLink } from '@/lib/affiliate/link';
import { track } from '@/lib/analytics/events';
import { bookingLink } from '@/lib/booking/links';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import type { Discount } from '@/lib/types/discount';
import { copyText } from './CopyCodeButton';

/** How long "continue, and don't show this again" holds. The owner's figure. */
const SNOOZE_MS = 10 * 60 * 1000;
const SNOOZE_KEY = 'yeshklita.beforeYouGo.snoozedUntil';

/**
 * Whether the dialog is snoozed. Browser storage may be missing or refuse
 * (a private window, blocked site data); then it is simply not snoozed.
 */
export function beforeYouGoSnoozed(now = Date.now()): boolean {
  try {
    return Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0) > now;
  } catch {
    return false;
  }
}

function snooze(now = Date.now()) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(now + SNOOZE_MS));
  } catch {
    // Not remembered; the dialog will simply ask again.
  }
}

/**
 * Between "see this plan" and the provider's page, to ask one thing: whether
 * they need a rental car too. It opens only once a real rental network is
 * connected. A discount code is not asked about here — it is copied on the
 * way out, and the dialog says so in a line.
 *
 * The owner's design, 28 September 2026:
 * - **Yes** (a car): the rental comparison opens in a new tab, and the dialog
 *   stays, so the plan is still one tap away.
 * - **No, go to the plan**: the dialog closes and the plan opens.
 * - **Cancel**: nothing happens; the click is undone.
 * - **Continue, and not again for ten minutes**: the plan opens, and the next
 *   ten minutes of clicks go straight through.
 *
 * Every way on to the plan copies the discount code as well, so nobody
 * arrives at the provider's checkout without it.
 */
export function BeforeYouGo({
  open,
  onClose,
  row,
  discount,
  link,
  dict,
  locale,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  row: ComparisonRow;
  /** A code to type at the provider's checkout, if there is one. */
  discount: Discount | null;
  link: OutboundLink;
  dict: Dictionary;
  locale: Locale;
  /** Raised as the traveller goes on to the plan; says whether the car was asked about here. */
  onContinue: (askedAboutCar: boolean) => void;
}) {
  const extras = useTripExtras();
  // Booking.com's car pages for the destination (the owner, 6 October 2026).
  // No link (Israel, or no country) means no question, so the way on to the
  // plan is never left without its plain button.
  const carHref = extras ? bookingLink('cars', extras.countryCode, locale) : null;
  const askCar = Boolean(extras?.carRentalOffer && carHref);
  const [carOpened, setCarOpened] = useState(false);
  const copy = dict.beforeYouGo;
  const provider = row.provider.name;

  useEffect(() => {
    if (open && askCar) {
      track({ name: 'car_rental_offer_shown', countryCode: extras?.countryCode ?? '', planId: row.plan.id });
    }
  }, [open, askCar, extras?.countryCode, row.plan.id]);

  const country = extras?.countryCode ? getCountryByCode(extras.countryCode) : undefined;

  const goOn = (thenSnooze: boolean) => {
    if (discount) void copyText(discount.code);
    if (thenSnooze) snooze();
    if (askCar && !carOpened) {
      track({ name: 'car_rental_offer_no', countryCode: extras?.countryCode ?? '', planId: row.plan.id });
    }
    onContinue(askCar);
  };

  // The way on to the plan, as a real link: it opens the provider in a new
  // tab from the traveller's own click, which no popup blocker stops.
  const toPlan = (label: string, variant: 'primary' | 'secondary', thenSnooze = false) => (
    <a
      href={link.href}
      rel={link.rel}
      target={link.target}
      onClick={() => goOn(thenSnooze)}
      className={buttonClasses(variant, 'md', 'w-full py-2 text-center')}
    >
      {label}
      <span className="sr-only"> {dict.plan.opensInNewTab}</span>
    </a>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={interpolate(copy.titleTemplate, { provider })}
      closeLabel={dict.common.close}
    >
      <div className="grid gap-4">

        {askCar && carHref ? (
          <div className="rounded-md border border-line p-4">
            <p className="font-head font-semibold">
              <span aria-hidden="true">🚗 </span>
              {country
                ? interpolate(dict.tripExtras.carRental.questionTemplate, { country: country.names[locale] })
                : dict.tripExtras.carRental.questionGeneric}
            </p>
            <p className="mt-1 text-sm text-ink-2">{dict.tripExtras.carRental.body}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href={carHref}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => {
                  setCarOpened(true);
                  track({ name: 'car_rental_offer_yes', countryCode: extras?.countryCode ?? '', planId: row.plan.id });
                }}
                className={buttonClasses('secondary', 'md', 'w-full border-brand py-2 text-center')}
              >
                {copy.carYes}
                <span className="sr-only"> {dict.tripExtras.carRental.opensInNewTab}</span>
              </a>
              {toPlan(interpolate(copy.carNoTemplate, { provider }), 'primary')}
            </div>
            <p className="mt-2 text-sm text-ink-2" aria-live="polite">
              {carOpened ? copy.carOpened : ''}
            </p>
          </div>
        ) : null}

        {/* With the car question, "no" is the way on; without it, this is. */}
        {askCar ? null : toPlan(interpolate(copy.continueTemplate, { provider }), 'primary')}
        {discount ? (
          <p className="text-sm text-teal-ink">
            <span aria-hidden="true">🏷️ </span>
            {interpolate(copy.codeCopiedOnContinueTemplate, { code: discount.code })}
          </p>
        ) : null}

        <div className="grid gap-2 border-t border-line-soft pt-4 sm:grid-cols-2">
          {toPlan(copy.continueAndSnooze, 'secondary', true)}
          <Button variant="quiet" onClick={onClose} className="w-full">
            {copy.cancel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

