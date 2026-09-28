'use client';

import { useEffect } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useTripExtras } from '@/components/extras/TripExtrasProvider';
import { getCountryByCode } from '@/data/countries';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { OutboundLink } from '@/lib/affiliate/link';
import { track } from '@/lib/analytics/events';
import { defaultRentalQuery, rentalQueryToParams } from '@/lib/carRental/query';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import type { Discount } from '@/lib/types/discount';
import { CopyCodeButton, copyText } from './CopyCodeButton';

/**
 * Between "see this plan" and the provider's page, when there is a code to
 * type there.
 *
 * The owner's ask: a traveller who leaves without the code pays full price,
 * and one who has to come back for it may not. So the button opens this
 * instead of the provider: the code, a button that copies it, and the way on —
 * which copies it as well, so nobody arrives at the provider's checkout
 * without it. When a real rental network is connected, the car question is
 * asked here too, once, rather than on the page afterwards.
 *
 * It never stands in the way: the way on is the first control after the code,
 * and closing the dialog leaves the traveller exactly where they were.
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
  discount: Discount;
  link: OutboundLink;
  dict: Dictionary;
  locale: Locale;
  /** Raised as the traveller goes on; says whether the car was asked about here. */
  onContinue: (askedAboutCar: boolean) => void;
}) {
  const extras = useTripExtras();
  const askCar = Boolean(extras?.carRentalOffer);
  const copy = dict.beforeYouGo;
  const provider = row.provider.name;

  useEffect(() => {
    if (open && askCar) {
      track({ name: 'car_rental_offer_shown', countryCode: extras?.countryCode ?? '', planId: row.plan.id });
    }
  }, [open, askCar, extras?.countryCode, row.plan.id]);

  const country = extras?.countryCode ? getCountryByCode(extras.countryCode) : undefined;
  const carHref = extras
    ? `${localePath(locale, '/car-rental')}${rentalQueryToParams(defaultRentalQuery(extras.countryCode ?? '', extras.tripDays))}`
    : null;
  const promo = interpolate(
    discount.audience === 'everyone' ? dict.plan.sitePromoTemplate : dict.plan.firstPurchasePromoTemplate,
    // Isolated, or the bidi algorithm puts the % sign on the wrong side of
    // the number in a Hebrew sentence ("%17").
    { percent: `\u2068${discount.percent}%\u2069` },
  );

  return (
    <Sheet open={open} onClose={onClose} title={interpolate(copy.titleTemplate, { provider })} closeLabel={dict.common.close}>
      <div className="grid gap-4">
        <div className="rounded-md bg-teal-50 p-4">
          <p className="font-head font-semibold text-teal-ink">
            <span aria-hidden="true">🏷️ </span>
            {promo}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span dir="ltr" className="rounded-sm border border-dashed border-teal-ink bg-surface px-3 py-2 font-mono text-lg font-bold tracking-wider select-all">
              {discount.code}
            </span>
            <CopyCodeButton code={discount.code} label={dict.plan.copyCode} copiedLabel={dict.plan.codeCopied} />
          </div>
          <p className="mt-2 text-sm text-ink-2">{interpolate(copy.pasteAtTemplate, { provider })}</p>
        </div>

        <a
          href={link.href}
          rel={link.rel}
          target={link.target}
          onClick={() => {
            void copyText(discount.code);
            onContinue(askCar);
          }}
          className={buttonClasses('primary', 'md', 'w-full')}
        >
          {interpolate(copy.continueTemplate, { provider })}
          <span className="sr-only"> {dict.plan.opensInNewTab}</span>
        </a>
        <p className="-mt-2 text-center text-sm text-ink-2">{copy.copiesOnContinue}</p>

        {askCar && carHref ? (
          <div className="border-t border-line-soft pt-4">
            <p className="font-head font-semibold">
              <span aria-hidden="true">🚗 </span>
              {country
                ? interpolate(dict.tripExtras.carRental.questionTemplate, { country: country.names[locale] })
                : dict.tripExtras.carRental.questionGeneric}
            </p>
            <p className="mt-1 text-sm text-ink-2">{dict.tripExtras.carRental.body}</p>
            <a
              href={carHref}
              target="_blank"
              rel="noopener"
              onClick={() =>
                track({ name: 'car_rental_offer_yes', countryCode: extras?.countryCode ?? '', planId: row.plan.id })
              }
              className={buttonClasses('secondary', 'md', 'mt-3')}
            >
              {dict.tripExtras.carRental.accept}
              <span className="sr-only"> {dict.tripExtras.carRental.opensInNewTab}</span>
            </a>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
