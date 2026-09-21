'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { countries } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { track } from '@/lib/analytics/events';
import { MAX_DRIVER_AGE, MIN_DRIVER_AGE } from '@/lib/carRental/query';
import { pickupKinds, type RentalQuery } from '@/lib/carRental/types';

/**
 * The rental search.
 *
 * A plain `<form method="get">`: submitting navigates, the server renders the
 * results, and the address bar ends up holding the whole search. That means
 * it works with JavaScript off, the back button behaves, and a traveller can
 * send the search to whoever is actually driving.
 *
 * Validation is the browser's own — `required`, `min`, `max`, `type="date"` —
 * which is announced by screen readers and translated for free, rather than a
 * bespoke error layer that would have to reimplement both.
 */
const fieldClass =
  'mt-1.5 h-12 w-full rounded-md border border-line bg-surface px-3 text-base text-ink focus-visible:border-brand';

export function RentalSearchForm({
  query,
  locale,
  dict,
}: {
  query: RentalQuery;
  locale: Locale;
  dict: Dictionary;
}) {
  const page = dict.carRentalPage;
  const [sameDropoff, setSameDropoff] = useState(query.sameDropoff);

  const sorted = [...countries].sort((a, b) =>
    a.names[locale].localeCompare(b.names[locale], locale),
  );

  return (
    <form method="get" className="mt-6 rounded-md border border-line bg-surface p-5">
      <h2 className="font-head text-xl font-semibold">{page.form.title}</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="rental-country" className="block text-sm font-semibold text-ink-2">
            {page.form.country}
          </label>
          <select
            id="rental-country"
            name="country"
            required
            defaultValue={query.countryCode}
            className={fieldClass}
          >
            <option value="">{page.form.countryPlaceholder}</option>
            {sorted.map((country) => (
              <option key={country.code} value={country.code}>
                {country.names[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rental-kind" className="block text-sm font-semibold text-ink-2">
            {page.form.pickupKind}
          </label>
          <select
            id="rental-kind"
            name="kind"
            defaultValue={query.pickupKind}
            className={fieldClass}
          >
            {pickupKinds.map((kind) => (
              <option key={kind} value={kind}>
                {page.pickupKinds[kind]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="rental-pickup" className="block text-sm font-semibold text-ink-2">
            {page.form.pickupLocation}
          </label>
          <input
            id="rental-pickup"
            name="pickup"
            type="text"
            required
            maxLength={120}
            autoComplete="off"
            defaultValue={query.pickupLocation}
            placeholder={page.form.pickupPlaceholder}
            className={fieldClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex min-h-11 items-center gap-2.5">
            <input
              type="checkbox"
              name="diff"
              value="1"
              checked={!sameDropoff}
              onChange={(event) => setSameDropoff(!event.target.checked)}
              className="size-5 accent-brand"
            />
            <span className="text-base">{page.form.sameDropoff}</span>
          </label>
        </div>

        {sameDropoff ? null : (
          <div className="md:col-span-2">
            <label htmlFor="rental-dropoff" className="block text-sm font-semibold text-ink-2">
              {page.form.dropoffLocation}
            </label>
            <input
              id="rental-dropoff"
              name="dropoff"
              type="text"
              required
              maxLength={120}
              autoComplete="off"
              defaultValue={query.dropoffLocation}
              placeholder={page.form.dropoffPlaceholder}
              className={fieldClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="rental-from" className="block text-sm font-semibold text-ink-2">
            {page.form.pickupDate}
          </label>
          <input
            id="rental-from"
            name="from"
            type="date"
            required
            defaultValue={query.pickupDate}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="rental-from-time" className="block text-sm font-semibold text-ink-2">
            {page.form.pickupTime}
          </label>
          <input
            id="rental-from-time"
            name="fromTime"
            type="time"
            required
            defaultValue={query.pickupTime}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="rental-until" className="block text-sm font-semibold text-ink-2">
            {page.form.dropoffDate}
          </label>
          <input
            id="rental-until"
            name="until"
            type="date"
            required
            defaultValue={query.dropoffDate}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="rental-until-time" className="block text-sm font-semibold text-ink-2">
            {page.form.dropoffTime}
          </label>
          <input
            id="rental-until-time"
            name="untilTime"
            type="time"
            required
            defaultValue={query.dropoffTime}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="rental-age" className="block text-sm font-semibold text-ink-2">
            {page.form.driverAge}
          </label>
          <input
            id="rental-age"
            name="age"
            type="number"
            inputMode="numeric"
            required
            min={MIN_DRIVER_AGE}
            max={MAX_DRIVER_AGE}
            defaultValue={query.driverAge}
            aria-describedby="rental-age-hint"
            className={fieldClass}
          />
          <p id="rental-age-hint" className="mt-1.5 text-sm text-ink-3">
            {page.form.driverAgeHint}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-3">{page.form.datesHint}</p>

      <Button
        type="submit"
        size="md"
        className="mt-4"
        onClick={() =>
          track({
            name: 'car_rental_search_started',
            countryCode: query.countryCode,
            pickupKind: query.pickupKind,
          })
        }
      >
        {page.form.submit}
      </Button>
    </form>
  );
}
