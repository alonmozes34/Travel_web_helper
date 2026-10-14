'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookingLogo } from '@/components/booking/BookingLogo';
import { useTripExtras } from '@/components/extras/TripExtrasProvider';
import { Checkbox } from '@/components/ui/Checkbox';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { PlannerCountry, PlannerLinks, PlannerPlace } from '@/lib/booking/planner';
import { count } from '@/lib/stats/client';

type Copy = Dictionary['bookingPlanner'];
type Kind = keyof PlannerLinks;
const KINDS: Kind[] = ['hotels', 'cars', 'attractions'];
const ICONS: Record<Kind, string> = { hotels: '🏨', cars: '🚗', attractions: '🎟️' };
const PAGE_STEP = { hotels: 'page-hotels', cars: 'page-cars', attractions: 'page-attractions' } as const;

/**
 * Hotels, car rental and attractions on Booking.com, for the places of the
 * trip the traveller names (the owner, 14 October 2026): "where in Italy?" —
 * Rome and Florence — and a row of links for each, for every country of the
 * trip. At the bottom of the page, after the eSIM: Booking pay only for a
 * booking finished in the same visit, and offered first it was the page a
 * phone visitor had to leave to go back and buy the eSIM. The reminder on the
 * first plan click says this waits here, and coming back from the plan's tab
 * brings it into view.
 *
 * Links only, never a price: Booking forbid putting their inventory next to
 * anyone else's. A city's link exists only where Booking's page for it opened
 * when checked; where it did not, the row says there is none.
 */
export function BookingPlanner({
  countries,
  copy,
  opensInNewTab,
  disclosure,
  onCountryPage = false,
}: {
  countries: PlannerCountry[];
  copy: Copy;
  opensInNewTab: string;
  disclosure: string;
  /** Counted apart: the planner on a country's page, or under a search's results. */
  onCountryPage?: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [announce, setAnnounce] = useState(false);
  const section = useRef<HTMLElement>(null);
  const said = useRef<HTMLParagraphElement>(null);
  const extras = useTripExtras();
  const chosen = extras?.chosenPlanId ?? null;

  const several = countries.length > 1;
  const places = useMemo(
    () =>
      countries.flatMap((country) =>
        [country.whole, ...country.cities].map((place) => ({ place, country, whole: place === country.whole })),
      ),
    [countries],
  );
  const rows = places.filter(({ place }) => picked.includes(place.key));

  // Back from the plan's tab, the section is brought into view, outlined for
  // a moment and said (the owner, 12 October 2026: "emphasise the option on
  // the page"). On a phone the new tab is where the visitor went; when they
  // come back they are among the plans, and this is at the bottom.
  useEffect(() => {
    if (!chosen) return;
    let done = false;
    let unmark: number | undefined;
    const bring = () => {
      const el = section.current;
      if (done || !el) return;
      done = true;
      const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
      el.classList.add('trip-extra-call');
      unmark = window.setTimeout(() => el.classList.remove('trip-extra-call'), 3000);
      if (said.current) said.current.textContent = copy.waiting;
      count({ e: 'booking', step: 'card', to: countries[0]?.code ?? null });
    };
    const back = () => {
      if (document.visibilityState === 'visible') bring();
    };
    const settle = window.setTimeout(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) bring();
    }, 800);
    document.addEventListener('visibilitychange', back);
    window.addEventListener('focus', back);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(unmark);
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('focus', back);
    };
  }, [chosen, copy.waiting, countries]);

  if (countries.length === 0) return null;

  const toggle = (place: PlannerPlace, code: string, on: boolean) => {
    setAnnounce(true);
    setPicked((current) => (on ? [...current.filter((key) => key !== place.key), place.key] : current.filter((key) => key !== place.key)));
    if (on) count({ e: 'booking', step: 'pick', to: code });
  };

  const label = (place: PlannerPlace, countryName: string, whole: boolean) =>
    whole ? interpolate(copy.wholeTemplate, { country: countryName }) : several ? `${place.name}, ${countryName}` : place.name;

  return (
    <section
      ref={section}
      id="booking-planner"
      aria-labelledby="booking-planner-title"
      className="mt-10 max-w-[80ch] scroll-mt-24 rounded-[20px] border border-line bg-surface p-5 md:p-6"
    >
      <p ref={said} role="status" className="sr-only" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="booking-planner-title" className="font-head text-xl font-semibold">
          {copy.title}
        </h2>
        <BookingLogo className="border border-line" />
      </div>
      <p className="mt-1 text-ink-2">{copy.intro}</p>

      <div className="mt-4 grid gap-4">
        {countries.map((country) => (
          <fieldset key={country.code} className="min-w-0 rounded-[14px] border border-line-soft bg-canvas px-4 pb-3 pt-1">
            <legend className="px-1 font-head text-lg font-semibold text-ink">
              {interpolate(copy.whereTemplate, { country: country.name })}
            </legend>
            <div className="grid gap-x-4 sm:grid-cols-2 md:grid-cols-3">
              {[...country.cities, country.whole].map((place) => (
                <Checkbox
                  key={place.key}
                  checked={picked.includes(place.key)}
                  onChange={(event) => toggle(place, country.code, event.currentTarget.checked)}
                  // Full size: the checkbox's own small print is for filters.
                  label={
                    <span className="text-base text-ink">
                      {place === country.whole ? interpolate(copy.wholeTemplate, { country: country.name }) : place.name}
                    </span>
                  }
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <h3 className="mt-6 font-head text-lg font-semibold">{copy.linksHeading}</h3>
      <p aria-live="polite" className="sr-only">
        {announce ? (rows.length === 1 ? copy.oneRow : interpolate(copy.rowsTemplate, { count: rows.length })) : ''}
      </p>
      {rows.length === 0 ? (
        <p className="mt-1 text-ink-2">{copy.empty}</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {rows.map(({ place, country, whole }) => {
            const name = label(place, country.name, whole);
            return (
              <li
                key={place.key}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border border-line bg-canvas px-4 py-3"
              >
                {/* No minimum width: at 200% text on a phone it pushed the row sideways. */}
                <span className="min-w-0 grow basis-40 font-semibold text-ink [overflow-wrap:anywhere]">{name}</span>
                <span className="flex min-w-0 max-w-full flex-wrap gap-2">
                  {KINDS.map((kind) => {
                    const href = place.links[kind];
                    // The whole country's attractions are its main city's, and say so.
                    const target = whole && kind === 'attractions' && place.attractionsCity ? place.attractionsCity : whole ? country.name : place.name;
                    const full = interpolate(copy.kinds[kind].inTemplate, { place: target });
                    if (!href) {
                      return (
                        <span key={kind} className="inline-flex min-h-11 items-center px-3 text-sm text-ink-3">
                          <span aria-hidden="true">{copy.kinds[kind].short}: —</span>
                          <span className="sr-only">{interpolate(copy.noPageTemplate, { kind: copy.kinds[kind].short, place: target })}</span>
                        </span>
                      );
                    }
                    return (
                      <a
                        key={kind}
                        href={href}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        onClick={() => count({ e: 'booking', step: onCountryPage ? PAGE_STEP[kind] : kind, to: country.code })}
                        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-1 text-start font-semibold text-brand hover:border-brand [overflow-wrap:anywhere]"
                      >
                        <span aria-hidden="true">{ICONS[kind]}</span>
                        {/* The name a screen reader hears holds the word on the button. */}
                        {whole && kind === 'attractions' ? (
                          full
                        ) : (
                          <>
                            <span aria-hidden="true">{copy.kinds[kind].short}</span>
                            <span className="sr-only">{full}</span>
                          </>
                        )}
                        <span className="sr-only"> {opensInNewTab}</span>
                      </a>
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-2">
        {opensInNewTab} {disclosure}
      </p>
    </section>
  );
}
