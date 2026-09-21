'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Ltr } from '@/components/ui/Bdi';
import { buttonClasses } from '@/components/ui/Button';
import type { CurrencyCode, Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { track } from '@/lib/analytics/events';
import { formatPrice } from '@/lib/formatters/price';
import { convertPrice, type FxRate } from '@/lib/pricing/convert';
import { pricePerDayMinor, type RentalOffer } from '@/lib/carRental/types';

/**
 * The offers.
 *
 * Two things this list refuses to do, both of them the ordinary dishonesty of
 * the rental comparison business:
 *
 *  - It never names a car as the car. A supplier guarantees a class, so the
 *    model is always "<model> or similar", and a row with no model supplied
 *    shows the category alone rather than borrowing one from a sibling.
 *  - It never fills in a policy it was not told. "Fuel policy not supplied"
 *    is a different sentence from "collect full, return full", and only one
 *    of them is true when the network sent nothing.
 *
 * Prices are converted for display through the same layer the eSIM side uses,
 * so a converted figure always carries the fact that it is converted.
 */
export function RentalResults({
  offers,
  locale,
  dict,
  currency,
  rates,
  markDemoRows,
  searchedLocation,
}: {
  offers: RentalOffer[];
  locale: Locale;
  dict: Dictionary;
  currency: CurrencyCode;
  rates: FxRate[];
  /** True only while demo and real rows share the page. */
  markDemoRows: boolean;
  searchedLocation: string;
}) {
  const page = dict.carRentalPage;
  const count = offers.length;
  const countryless = searchedLocation;

  useEffect(() => {
    track({ name: 'car_rental_results_viewed', countryCode: '', resultCount: count });
  }, [count]);

  if (count === 0) {
    return (
      <div className="mt-6 rounded-md border border-line bg-surface-2 p-5">
        <p className="font-head font-semibold">{page.results.none}</p>
        <p className="mt-2 max-w-[60ch] text-ink-2">{page.results.noneHint}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-head text-xl font-semibold">
          {interpolate(page.results.titleTemplate, { location: countryless })}
        </h2>
        <p role="status" className="text-sm text-ink-3">
          {count === 1 ? page.results.oneResult : interpolate(page.results.countTemplate, { count })}
        </p>
      </div>

      {offers.some((offer) => offer.currency !== currency) ? (
        <p className="mt-2 text-sm text-ink-3">{page.results.convertedNote}</p>
      ) : null}

      <ul className="mt-4 grid gap-4">
        {offers.map((offer) => {
          const days = offer.rentalDays;
          const total = convertPrice(offer.totalPriceMinor, offer.currency, currency, rates);
          const perDay = convertPrice(
            pricePerDayMinor(offer),
            offer.currency,
            currency,
            rates,
          );

          return (
            <li key={offer.id} className="rounded-md border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {markDemoRows && offer.source === 'demo' ? (
                      <Badge tone="warn">{page.demo.rowLabel}</Badge>
                    ) : null}
                    <h3 className="font-head text-lg font-semibold">
                      {page.categories[offer.category]}
                    </h3>
                    <span className="text-ink-2">
                      <Ltr>{offer.supplierName}</Ltr>
                    </span>
                  </div>

                  <p className="mt-1 text-ink-2">
                    {offer.exampleModel
                      ? interpolate(page.results.orSimilarTemplate, { model: offer.exampleModel })
                      : page.results.categoryOnly}
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                    <li>{interpolate(page.results.seatsTemplate, { count: offer.seats })}</li>
                    <li>{interpolate(page.results.bagsTemplate, { count: offer.bags })}</li>
                    <li>{page.transmission[offer.transmission]}</li>
                    <li>{page.mileage[offer.mileagePolicy]}</li>
                    <li>{page.cancellation[offer.cancellation]}</li>
                  </ul>

                  <dl className="mt-3 grid gap-1 text-sm">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-ink-3">{page.results.pickupLabel}:</dt>
                      <dd className="text-ink-2">
                        <Ltr>{offer.pickupDescription}</Ltr>
                      </dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-ink-3">{page.results.fuelLabel}:</dt>
                      <dd className="text-ink-2">{page.fuel[offer.fuelPolicy]}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-ink-3">{page.results.insuranceLabel}:</dt>
                      <dd className="text-ink-2">{page.insurance[offer.insurance]}</dd>
                    </div>
                  </dl>

                  <p className="mt-2 text-sm text-ink-3">
                    {offer.rating
                      ? `${interpolate(page.results.ratingTemplate, {
                          score: offer.rating.score,
                          outOf: offer.rating.outOf,
                        })}${
                          offer.rating.count
                            ? ` · ${interpolate(page.results.ratingCountTemplate, {
                                count: offer.rating.count,
                              })}`
                            : ''
                        }`
                      : page.results.noRating}
                  </p>
                </div>

                <div className="grid gap-1 md:text-end">
                  <Ltr className="tnum block font-head text-2xl font-bold">
                    {formatPrice(total.amountMinor, total.currency, locale)}
                  </Ltr>
                  <span className="text-sm text-ink-3">
                    {page.results.total} · {interpolate(page.results.daysTemplate, { days })}
                  </span>
                  <span className="text-sm text-ink-2">
                    {interpolate(page.results.perDayTemplate, {
                      price: formatPrice(perDay.amountMinor, perDay.currency, locale),
                    })}
                  </span>
                  {/* A converted figure never stands alone: the company bills
                      in its own currency, and the shekel number is ours. */}
                  {total.isConverted ? (
                    <span className="text-sm text-ink-3">
                      {interpolate(page.results.chargedTemplate, {
                        amount: formatPrice(total.sourceAmountMinor, total.sourceCurrency, locale),
                      })}
                    </span>
                  ) : null}

                  {offer.bookingUrl ? (
                    <a
                      href={offer.bookingUrl}
                      rel="sponsored noopener noreferrer"
                      target="_blank"
                      onClick={() =>
                        track({
                          name: 'car_rental_deal_clicked',
                          offerId: offer.id,
                          sourceId: offer.sourceId,
                        })
                      }
                      className={buttonClasses('primary', 'sm', 'mt-2')}
                    >
                      {page.results.viewDeal}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-ink-3">{page.results.noLink}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
