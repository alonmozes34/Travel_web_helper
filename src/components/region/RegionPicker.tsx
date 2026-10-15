'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProviderLogo } from '@/components/plans/ProviderCell';
import { Button } from '@/components/ui/Button';
import { Ltr } from '@/components/ui/Bdi';
import { getProvider } from '@/data/providers';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';

export type RegionCountry = { code: string; name: string; flag: string; href: string; hasPlans: boolean };

/** One family of plans, as the server priced and worded it. */
export type RegionCard = {
  key: string;
  providerId: string;
  providerName: string;
  /** The provider's own name for the coverage, where it has one. */
  label: string | null;
  covered: string[];
  /** Names, in the region's order. */
  coveredNames: string[];
  /** Names, in the region's order. */
  missing: string[];
  outside: number;
  sizes: number;
  /** `period` is worded on the server: "for 7 days", "for one day". */
  cheapest: { price: string; size: string; period: string };
  bestPerGb: { perGb: string; size: string; period: string } | null;
  hasUnlimited: boolean;
};

const FIRST_CARDS = 8;

/**
 * "Which of these countries are you going to?" — and the plans that cover
 * every one ticked, then on to the search with them (the owner, 15 October
 * 2026). Nothing ticked shows every plan that covers two or more.
 *
 * Without JavaScript the form still works: the ticks reach the search as
 * `to=HR&to=ME`, which the search reads as one trip.
 */
export function RegionPicker({
  inRegion,
  countries,
  cards,
  initialTicked = [],
  copy,
  searchPath,
}: {
  /** "in the Balkans": Hebrew folds the preposition into the name ("בבלקן"). */
  inRegion: string;
  countries: RegionCountry[];
  cards: RegionCard[];
  /** Countries already chosen in the search, ticked from the start. */
  initialTicked?: string[];
  copy: Dictionary['regionPage'];
  searchPath: string;
}) {
  const router = useRouter();
  const [ticked, setTicked] = useState<string[]>(initialTicked);
  const [all, setAll] = useState(false);
  const [error, setError] = useState('');

  const order = countries.map((country) => country.code);
  const fitting = cards.filter((card) => ticked.every((code) => card.covered.includes(code)));
  const shown = all ? fitting : fitting.slice(0, FIRST_CARDS);

  const toggle = (code: string, on: boolean) => {
    setError('');
    setTicked((current) => order.filter((c) => (c === code ? on : current.includes(c))));
  };

  return (
    <>
      <form
        action={searchPath}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          if (ticked.length === 0) {
            setError(copy.pickFirst);
            return;
          }
          router.push(`${searchPath}?to=${ticked.join(',')}`);
        }}
        className="max-w-[80ch] rounded-[20px] border border-line bg-surface p-5 md:p-6"
      >
        <fieldset className="min-w-0">
          <legend className="font-head text-xl font-semibold text-ink">
            {interpolate(copy.pickTemplate, { inRegion })}
          </legend>
          <p className="mt-1 text-ink-2">{copy.pickHint}</p>
          <div className="mt-3 grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
            {countries.map((country) => (
              <label key={country.code} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base text-ink">
                <input
                  type="checkbox"
                  name="to"
                  value={country.code}
                  checked={ticked.includes(country.code)}
                  onChange={(event) => toggle(country.code, event.currentTarget.checked)}
                  className="size-5 shrink-0 accent-brand"
                />
                <span aria-hidden="true">{country.flag}</span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{country.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p aria-live="polite" className="mt-3 font-semibold text-teal-ink">
          {ticked.length === 0
            ? interpolate(copy.allCountTemplate, { count: cards.length })
            : interpolate(copy.fitCountTemplate, { count: fitting.length, total: cards.length })}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit">{copy.toSearch}</Button>
          <p aria-live="polite" className="text-warn-ink">
            {error}
          </p>
        </div>
        <p className="mt-2 text-sm text-ink-2">{copy.toSearchHint}</p>
      </form>

      <section aria-labelledby="region-plans" className="mt-10 max-w-[80ch]">
        <h2 id="region-plans" className="font-head text-xl font-semibold">
          {interpolate(copy.plansTitleTemplate, { inRegion })}
        </h2>
        <p className="mt-1 text-ink-2">{copy.orderNote}</p>
        {fitting.length === 0 ? (
          <p className="mt-4 rounded-md border border-line bg-surface px-4 py-3 text-ink">
            {cards.length === 0 ? copy.noneAtAll : copy.noneFit}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {shown.map((card) => (
              <li key={card.key}>
                <Card card={card} total={countries.length} copy={copy} />
              </li>
            ))}
          </ul>
        )}
        {fitting.length > FIRST_CARDS && !all ? (
          <button
            type="button"
            onClick={() => setAll(true)}
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
          >
            {interpolate(copy.showAllTemplate, { count: fitting.length })}
          </button>
        ) : null}
      </section>
    </>
  );
}

function Card({ card, total, copy }: { card: RegionCard; total: number; copy: Dictionary['regionPage'] }) {
  const provider = getProvider(card.providerId);
  const whole = card.missing.length === 0;
  return (
    <article className="min-w-0 rounded-[16px] border border-line bg-surface px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {provider ? <ProviderLogo provider={provider} /> : null}
        <h3 className="font-head text-lg font-semibold" lang="en" dir="ltr">
          {card.providerName}
        </h3>
        {card.label ? <span className="text-base text-ink-2">{interpolate(copy.labelTemplate, { label: card.label })}</span> : null}
      </div>
      <p className={`mt-2 font-semibold ${whole ? 'text-teal-ink' : 'text-ink'}`}>
        {interpolate(whole ? copy.coversAllTemplate : copy.coversTemplate, { count: card.covered.length, total })}
      </p>
      {/* Whichever list is shorter: "missing 27 countries" by name is a wall. */}
      {whole ? null : (
        <p className="mt-1 text-ink-2 [overflow-wrap:anywhere]">
          {card.missing.length <= card.coveredNames.length
            ? interpolate(copy.missingTemplate, { names: card.missing.join(', ') })
            : interpolate(copy.onlyTemplate, { names: card.coveredNames.join(', ') })}
        </p>
      )}
      {card.outside > 0 ? (
        <p className="mt-1 text-ink-2">
          {card.outside === 1 ? copy.outsideOne : interpolate(copy.outsideTemplate, { count: card.outside })}
        </p>
      ) : null}
      <p className="mt-2 text-ink">
        {card.sizes === 1 ? (
          <Priced template={copy.oneSizeTemplate} price={card.cheapest.price} values={card.cheapest} strong />
        ) : (
          <>
            {interpolate(copy.sizesTemplate, { count: card.sizes })}{' '}
            <Priced template={copy.cheapestTemplate} price={card.cheapest.price} values={card.cheapest} strong />
          </>
        )}
      </p>
      {card.bestPerGb ? (
        <p className="mt-1 text-ink-2">
          <Priced template={card.sizes === 1 ? copy.perGbOneTemplate : copy.perGbTemplate} price={card.bestPerGb.perGb} values={card.bestPerGb} />
        </p>
      ) : null}
      {card.hasUnlimited ? <p className="mt-1 text-ink-2">{copy.hasUnlimited}</p> : null}
    </article>
  );
}

/** A sentence with a price in it, the price kept left-to-right inside Hebrew. */
function Priced({
  template,
  price,
  values,
  strong = false,
}: {
  template: string;
  price: string;
  values: { size: string; period: string };
  strong?: boolean;
}) {
  const [before, after = ''] = template.split('{price}');
  return (
    <>
      {interpolate(before, values)}
      <Ltr className={strong ? 'tnum font-semibold' : 'tnum'}>{price}</Ltr>
      {interpolate(after, values)}
    </>
  );
}
