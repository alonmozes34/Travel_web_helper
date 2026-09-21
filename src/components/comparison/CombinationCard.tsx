'use client';

import { useState } from 'react';
import { Ltr } from '@/components/ui/Bdi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { countries } from '@/data/countries';
import { getProvider } from '@/data/mockProviders';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { Combination } from '@/lib/comparison/buildCombination';
import { track } from '@/lib/analytics/events';
import { useTripExtras } from '@/components/extras/TripExtrasProvider';
import { formatData } from '@/lib/formatters/data';
import { formatPrice } from '@/lib/formatters/price';

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * Two or more plans presented as one option, with a total.
 *
 * This is the answer for a trip no single plan serves well — a night in
 * Germany then two weeks in the States. No provider will ever suggest buying
 * from a competitor to save money, which is precisely why a comparison site
 * should. The trade-off is stated rather than buried: it is two purchases and
 * two installations.
 */
export function CombinationCard({
  combination,
  cheapestSingleMinor,
  locale,
  dict,
}: {
  combination: Combination;
  /** The cheapest single plan covering the whole trip, when one exists. */
  cheapestSingleMinor: number | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const [noted, setNoted] = useState(false);
  const tripExtras = useTripExtras();
  const difference = cheapestSingleMinor === null ? null : cheapestSingleMinor - combination.totalMinor;
  const isConverted = combination.legs.some((leg) => leg.sourceCurrency !== combination.currency);

  return (
    <article className="rounded-lg border border-teal bg-teal-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge tone="value">
          <span aria-hidden="true">🧩</span>
          {dict.combination.badge}
        </Badge>
        {/* An H2, not an H3: the combination sits directly under the page
            H1 as a peer of the results list, and a level skipped for visual
            weight is a level a screen-reader user has to guess at. */}
        <h2 className="font-head text-lg font-semibold">
          {interpolate(dict.combination.titleTemplate, { count: combination.legs.length })}
        </h2>
      </div>

      <ul className="mt-4 grid gap-2.5">
        {combination.legs.map((leg) => {
          const provider = getProvider(leg.plan.providerId);
          const names = leg.countryCodes
            .map((code) => byCode.get(code)?.names[locale] ?? code)
            .join(', ');

          return (
            <li
              key={leg.plan.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm bg-surface px-3 py-2.5"
            >
              <span className="font-head font-semibold">{provider?.name ?? leg.plan.providerId}</span>
              <span className="text-base text-ink-2">{leg.plan.planName}</span>
              <span className="text-sm text-ink-3">
                {interpolate(dict.combination.legTemplate, { countries: names })}
                {' · '}
                {leg.plan.isUnlimited ? dict.units.unlimited : formatData(leg.plan.dataAmountMb, locale)}
              </span>
              {/* The total below is in shekels, so the legs must be too, or
                  the one card whose whole argument is "these two add up to
                  less" is the one card where the arithmetic does not visibly
                  work. The charged figure stays, underneath and labelled, the
                  same way every plan card states it. */}
              <span className="ms-auto text-end">
                <Ltr className="tnum block font-head font-semibold">
                  {formatPrice(leg.priceMinor, combination.currency, locale)}
                </Ltr>
                {leg.sourceCurrency === combination.currency ? null : (
                  <span className="block text-xs text-ink-3">
                    {interpolate(dict.combination.legChargedTemplate, {
                      amount: formatPrice(leg.sourcePriceMinor, leg.sourceCurrency, locale),
                    })}
                  </span>
                )}
              </span>
              {/* Each leg is a separate purchase, so each one needs its own way out. */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  track({
                    name: 'provider_clicked',
                    planId: leg.plan.id,
                    providerId: leg.plan.providerId,
                  });
                  // A leg of a combination is a chosen plan like any other.
                  tripExtras?.choose(leg.plan.id);
                  setNoted(true);
                }}
              >
                {dict.plan.view}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-teal/40 pt-3">
        <span className="font-head font-semibold">{dict.combination.total}</span>
        <Ltr className="tnum font-head text-2xl font-bold tracking-tight">
          {formatPrice(combination.totalMinor, combination.currency, locale)}
        </Ltr>
        <span className="text-sm text-ink-2">
          {difference === null
            ? dict.combination.onlyOption
            : interpolate(
                difference > 0 ? dict.combination.cheaperTemplate : dict.combination.dearerTemplate,
                { amount: formatPrice(Math.abs(difference), combination.currency, locale) },
              )}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink-3" aria-live="polite">
        {noted ? dict.plan.prototypeLink : dict.combination.note}
      </p>

      {/* When no single plan covers the trip this card is the whole page, and
          the conversion explanation that lives under the results list is not
          rendered at all. A converted price without it is a number nobody can
          check. */}
      {isConverted ? (
        <p className="mt-1 text-sm text-ink-3">{dict.plan.conversionNote}</p>
      ) : null}
    </article>
  );
}
