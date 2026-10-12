'use client';

import { useId } from 'react';
import { BookingLogo } from '@/components/booking/BookingLogo';
import { PlanName } from '@/components/plans/PlanName';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { getCountryByCode } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { OutboundLink } from '@/lib/affiliate/link';
import { bookingLink } from '@/lib/booking/links';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import type { Discount } from '@/lib/types/discount';
import { isTripExtraDeclined } from '@/lib/tripExtras/dismissal';

/**
 * Said once a visit, on the first click through to a plan (the owner,
 * 12 October 2026): the plan opens in a new tab, and hotels and cars on
 * Booking.com wait here. A phone jumps straight to the new tab, so without it
 * the Booking card on this page went unseen.
 *
 * It only says so. There is no link to Booking in it: offered before the
 * plan, Booking was the page a phone visitor had to leave to go back and buy
 * the eSIM, and Booking pay only for a booking finished in the same visit
 * (removed for that on 9 October). The way on is the plan; Booking is the
 * card that waits on this page.
 */

/** Once a visit: kept in memory, not in the browser's storage. */
let remindedThisVisit = false;

/** Whether this click should say so first: Booking applies here, the visitor has not waved it away, and has not been told yet. */
export function bookingReminderDue(
  extras: { carRentalOffer: boolean; countryCode: string | undefined } | null,
  locale: Locale,
): boolean {
  if (remindedThisVisit || !extras?.carRentalOffer || !extras.countryCode) return false;
  if (!getCountryByCode(extras.countryCode) || !bookingLink('hotels', extras.countryCode, locale)) return false;
  return !isTripExtraDeclined('carRental');
}

export function BookingReminder({
  open,
  onClose,
  onContinue,
  row,
  link,
  discount,
  countryCode,
  dict,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  /** Raised as the visitor follows the link on to the plan. */
  onContinue: () => void;
  row: ComparisonRow;
  link: OutboundLink;
  /** A code to type at the provider's checkout, copied on the way. */
  discount: Discount | null;
  countryCode: string;
  dict: Dictionary;
  locale: Locale;
}) {
  // The way on says which plan, from inside the dialog: the page behind a
  // modal dialog is inert, and a description pointing out of it is dropped.
  const planNameId = useId();
  const copy = dict.tripExtras.reminder;
  const provider = row.provider.name;
  const country = getCountryByCode(countryCode)?.names[locale] ?? '';

  return (
    <Sheet open={open} onClose={onClose} title={interpolate(copy.titleTemplate, { provider })} closeLabel={dict.common.close}>
      <div className="grid gap-4">
        <p id={planNameId} className="sr-only">
          <PlanName row={row} dict={dict} locale={locale} />
        </p>
        <div className="flex items-start gap-3">
          <BookingLogo className="shrink-0 border border-line" />
          <p className="text-ink">{interpolate(copy.bodyTemplate, { country })}</p>
        </div>
        {discount ? (
          <p className="text-sm text-teal-ink">
            <span aria-hidden="true">🏷️ </span>
            {interpolate(copy.codeTemplate, { code: discount.code })}
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <a
            href={link.href}
            rel={link.rel}
            target={link.target}
            aria-describedby={planNameId}
            onClick={() => {
              remindedThisVisit = true;
              onContinue();
            }}
            className={buttonClasses('primary', 'md', 'w-full py-2 text-center')}
          >
            {interpolate(copy.continueTemplate, { provider })}
            <span className="sr-only"> {dict.plan.opensInNewTab}</span>
          </a>
          <Button variant="quiet" onClick={onClose} className="w-full">
            {copy.cancel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
