'use client';

import { useId, useState } from 'react';
import { Ltr } from '@/components/ui/Bdi';
import { cn } from '@/components/ui/cn';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { dailyDataMbByUsage } from '@/lib/comparison/estimateDataNeed';
import { formatData } from '@/lib/formatters/data';
import {
  MAX_REQUESTED_GB,
  parseRequestedGb,
  usageLevels,
  type TripProfile,
  type UsageLevel,
} from '@/lib/types/trip';

/**
 * How the connection will be used.
 *
 * Two things a traveller may know, and the form takes either. Most people can
 * only describe their usage in words, so the options do that — and each one
 * shows the daily figure we will apply, because that number is our assumption
 * rather than a measurement and hiding it would make the recommendation
 * unauditable. Someone who already knows they need 100GB because the eSIM is
 * replacing their broadband can say so directly, and their figure replaces the
 * estimate outright rather than being averaged with it.
 *
 * The range is the point: navigation and tethering are twenty times apart, and
 * a scale topping out at "heavy" cannot describe the second.
 *
 * Radio buttons rather than toggle chips: this is one choice out of several,
 * not several independent switches, and the semantics should say so.
 */
export function TripPersonalization({
  dict,
  locale,
  profile,
  onChange,
}: {
  dict: Dictionary;
  locale: Locale;
  profile: TripProfile;
  onChange: (profile: TripProfile) => void;
}) {
  const name = useId();
  const gbFieldId = useId();
  const [gbDraft, setGbDraft] = useState(
    profile.requestedGb !== undefined ? String(profile.requestedGb) : '',
  );

  const exactChosen = profile.requestedGb !== undefined;

  function chooseUsage(level: UsageLevel) {
    // Picking a usage clears a stated figure and the reverse, because the two
    // answer the same question and keeping both would leave the traveller
    // unable to tell which one the results came from.
    onChange({ ...profile, usage: level, requestedGb: undefined });
  }

  function chooseExact(raw: string) {
    setGbDraft(raw);
    const gb = parseRequestedGb(raw);
    onChange({ ...profile, usage: undefined, requestedGb: gb });
  }

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-head text-lg font-semibold">{dict.personalization.title}</p>
      <p className="mt-1 text-sm text-ink-2">{dict.personalization.note}</p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold text-ink-2">
          {dict.personalization.usageLabel}
        </legend>

        <div className="grid gap-2 sm:grid-cols-2">
          {usageLevels.map((level: UsageLevel) => {
            const isActive = !exactChosen && profile.usage === level;
            return (
              <label
                key={level}
                className={cn(
                  'flex min-h-12 cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
                  isActive
                    ? 'border-brand bg-brand-50'
                    : 'border-line bg-surface hover:border-brand',
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={level}
                  checked={isActive}
                  onChange={() => chooseUsage(level)}
                  className="peer sr-only"
                />
                <Marker active={isActive} />
                <span className="min-w-0">
                  <span className={cn('block font-semibold', isActive && 'text-brand')}>
                    {dict.personalization.usages[level]}
                  </span>
                  <span className="block text-sm text-ink-2">
                    {dict.personalization.usageHints[level]}
                  </span>
                  {level === 'unlimited' ? null : (
                    <span className="mt-0.5 block text-xs text-ink-3">
                      <Ltr className="tnum">
                        {interpolate(dict.personalization.perDayTemplate, {
                          amount: formatData(dailyDataMbByUsage[level], locale),
                        })}
                      </Ltr>
                    </span>
                  )}
                </span>
              </label>
            );
          })}

          {/* The traveller who already knows their number. Theirs beats ours. */}
          <label
            className={cn(
              'flex min-h-12 cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors sm:col-span-2',
              exactChosen ? 'border-brand bg-brand-50' : 'border-line bg-surface hover:border-brand',
            )}
          >
            <input
              type="radio"
              name={name}
              value="exact"
              checked={exactChosen}
              onChange={() => chooseExact(gbDraft || String(dict.personalization.exactPlaceholder))}
              className="peer sr-only"
            />
            <Marker active={exactChosen} />
            <span className="min-w-0 flex-1">
              <span className={cn('block font-semibold', exactChosen && 'text-brand')}>
                {dict.personalization.exactLabel}
              </span>
              <span className="block text-sm text-ink-2">{dict.personalization.exactHint}</span>

              <span className="mt-2 flex flex-wrap items-center gap-2">
                <label htmlFor={gbFieldId} className="text-sm text-ink-2">
                  {dict.personalization.exactFieldLabel}
                </label>
                <input
                  id={gbFieldId}
                  type="number"
                  min={1}
                  max={MAX_REQUESTED_GB}
                  step="1"
                  inputMode="numeric"
                  value={gbDraft}
                  placeholder={dict.personalization.exactPlaceholder}
                  onChange={(event) => chooseExact(event.target.value)}
                  className="tnum h-11 w-24 rounded-sm border border-line bg-surface px-2 text-center text-base text-ink"
                />
                <span className="text-sm text-ink-2">GB</span>
              </span>
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  );
}

function Marker({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
        active ? 'border-brand' : 'border-line',
        'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
      )}
    >
      {active ? <span className="size-2.5 rounded-full bg-brand" /> : null}
    </span>
  );
}
