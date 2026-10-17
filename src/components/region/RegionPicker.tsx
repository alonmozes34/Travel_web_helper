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
  /** On the page across continents: the countries on each continent, worded. */
  continents?: string;
};

const FIRST_CARDS = 8;

/** A continent's countries, on the page across continents. */
export type RegionGroup = { id: string; name: string; codes: string[] };

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
  groups,
}: {
  /** "in the Balkans": Hebrew folds the preposition into the name ("בבלקן"). */
  inRegion: string;
  countries: RegionCountry[];
  cards: RegionCard[];
  /** Countries already chosen in the search, ticked from the start. */
  initialTicked?: string[];
  copy: Dictionary['regionPage'];
  searchPath: string;
  /**
   * The page across continents (the owner, 17 October 2026: "a multiple
   * choice, and from there we put the right plan together"). Every country is
   * a wall of ticks, so they come a continent at a time, each closed until
   * opened, with a box that finds a country by name; and the trip runs in the
   * order they were ticked rather than the region's.
   */
  groups?: RegionGroup[];
}) {
  const router = useRouter();
  const world = Boolean(groups);
  const [ticked, setTicked] = useState<string[]>(initialTicked);
  const [all, setAll] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<string[]>(() =>
    (groups ?? []).filter((group) => group.codes.some((code) => initialTicked.includes(code))).map((group) => group.id),
  );

  const order = countries.map((country) => country.code);
  const byCode = new Map(countries.map((country) => [country.code, country]));
  const fitting = cards.filter((card) => ticked.every((code) => card.covered.includes(code)));
  const shown = all ? fitting : fitting.slice(0, FIRST_CARDS);
  const query = filter.trim().toLocaleLowerCase();
  const found = query ? countries.filter((country) => country.name.toLocaleLowerCase().includes(query)) : [];

  const toggle = (code: string, on: boolean) => {
    setError('');
    setTicked((current) =>
      world
        ? on
          ? [...current.filter((c) => c !== code), code]
          : current.filter((c) => c !== code)
        : order.filter((c) => (c === code ? on : current.includes(c))),
    );
  };

  const tick = (country: RegionCountry) => (
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
  );
  const grid = 'grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3';

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
            {world ? copy.worldSearchTitle : interpolate(copy.pickTemplate, { inRegion })}
          </legend>
          <p className="mt-1 text-ink-2">{world ? copy.worldPickHint : copy.pickHint}</p>
          {groups ? (
            <>
              <label className="mt-4 block max-w-[24rem]">
                <span className="font-semibold text-ink">{copy.worldFilterLabel}</span>
                <input
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.currentTarget.value)}
                  className="mt-1 block min-h-11 w-full rounded-md border border-line bg-surface px-3 text-base text-ink"
                />
              </label>
              {query ? (
                found.length > 0 ? (
                  <div className={`mt-3 ${grid}`}>{found.map(tick)}</div>
                ) : (
                  <p className="mt-3 text-ink-2">{copy.worldFilterNone}</p>
                )
              ) : (
                <div className="mt-3 grid gap-2">
                  {groups.map((group) => {
                    const here = group.codes.filter((code) => ticked.includes(code)).length;
                    return (
                      <details
                        key={group.id}
                        open={open.includes(group.id)}
                        onToggle={(event) => {
                          const isOpen = event.currentTarget.open;
                          setOpen((current) =>
                            isOpen ? (current.includes(group.id) ? current : [...current, group.id]) : current.filter((id) => id !== group.id),
                          );
                        }}
                        className="group rounded-md border border-line"
                      >
                        <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 px-3 font-semibold text-ink">
                          {group.name}
                          {here > 0 ? (
                            <span className="text-sm font-normal text-teal-ink">
                              {interpolate(copy.worldGroupChosenTemplate, { count: here })}
                            </span>
                          ) : null}
                          {/* A flex summary loses the browser's own marker, and a row with
                              nothing to say it opens reads as a heading. */}
                          <span aria-hidden="true" className="ms-auto text-ink-2 group-open:rotate-180">
                            ▾
                          </span>
                        </summary>
                        <div className={`px-3 pb-2 ${grid}`}>{group.codes.map((code) => tick(byCode.get(code)!))}</div>
                      </details>
                    );
                  })}
                </div>
              )}
              {ticked.length > 0 ? (
                <p className="mt-3 text-ink [overflow-wrap:anywhere]">
                  {interpolate(copy.worldChosenTemplate, { names: ticked.map((code) => byCode.get(code)?.name ?? code).join(', ') })}
                </p>
              ) : null}
            </>
          ) : (
            <div className={`mt-3 ${grid}`}>{countries.map(tick)}</div>
          )}
        </fieldset>
        <p aria-live="polite" className="mt-3 font-semibold text-teal-ink">
          {ticked.length === 0
            ? interpolate(world ? copy.worldAllCountTemplate : copy.allCountTemplate, { count: cards.length })
            : interpolate(world ? copy.worldFitCountTemplate : copy.fitCountTemplate, { count: fitting.length, total: cards.length })}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit">{world ? copy.worldToSearch : copy.toSearch}</Button>
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
        <p className="mt-1 text-ink-2">{world ? copy.worldOrderNote : copy.orderNote}</p>
        {fitting.length === 0 ? (
          <p className="mt-4 rounded-md border border-line bg-surface px-4 py-3 text-ink">
            {cards.length === 0 ? copy.noneAtAll : world ? copy.worldNoneFit : copy.noneFit}
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
      {card.continents ? (
        <p className="mt-2 font-semibold text-ink [overflow-wrap:anywhere]">
          {interpolate(copy.worldCoversTemplate, { count: card.covered.length, continents: card.continents })}
        </p>
      ) : (
      <p className={`mt-2 font-semibold ${whole ? 'text-teal-ink' : 'text-ink'}`}>
        {interpolate(whole ? copy.coversAllTemplate : copy.coversTemplate, { count: card.covered.length, total })}
      </p>
      )}
      {/* Whichever list is shorter: "missing 27 countries" by name is a wall. */}
      {whole || card.continents ? null : (
        <p className="mt-1 text-ink-2 [overflow-wrap:anywhere]">
          {card.missing.length <= card.coveredNames.length
            ? interpolate(copy.missingTemplate, { names: card.missing.join(', ') })
            : interpolate(copy.onlyTemplate, { names: card.coveredNames.join(', ') })}
        </p>
      )}
      {card.outside > 0 && !card.continents ? (
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
