'use client';

import { useId, useState } from 'react';
import { cn } from '@/components/ui/cn';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { BASE_DAILY_MB, dailyMbByActivity, dailyMbForActivities } from '@/lib/comparison/estimateDataNeed';
import { formatData } from '@/lib/formatters/data';
import {
  MAX_REQUESTED_GB,
  dataActivities,
  normaliseActivities,
  parseRequestedGb,
  shownActivities,
  totalTripDays,
  type DataActivity,
  type TripProfile,
} from '@/lib/types/trip';

/**
 * How much data the trip needs, worked out from what the traveller will do
 * (the owner, 15 October 2026: "according to how much they do, we fit the
 * plan"). It replaced six usage levels: "regular" is a word everyone reads
 * differently, while "video calls" is a thing a traveller knows whether they
 * will do.
 *
 * Maps and messages are always counted; each tick adds its own daily figure,
 * shown next to it, and the sum is said under the list as it changes — the
 * figures are our assumptions, and the recommendation stays auditable only if
 * they are on screen. Social media starts ticked, the old default, so a
 * traveller who changes nothing is sized as before and can see how.
 *
 * Two answers sit outside the sum. "Unlimited" is a preference, kept next to
 * the ticks, which still say how much a day its fair-usage limit has to carry.
 * A GB figure the traveller types replaces the sum outright — someone who
 * knows they need 100GB knows something no daily average does — and ticking
 * again clears it, so the results never come from an answer they cannot see.
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
  const copy = dict.personalization;
  const gbFieldId = useId();
  const gbHintId = useId();
  const [gbDraft, setGbDraft] = useState(
    profile.requestedGb !== undefined ? String(profile.requestedGb) : '',
  );

  const ticked = shownActivities(profile);
  const unlimited = profile.usage === 'unlimited';
  const stated = profile.requestedGb;
  const days = totalTripDays(profile);
  const daily = dailyMbForActivities(ticked);

  function tick(activity: DataActivity, on: boolean) {
    setGbDraft('');
    onChange({
      ...profile,
      activities: normaliseActivities(on ? [...ticked, activity] : ticked.filter((a) => a !== activity)),
      usage: unlimited ? 'unlimited' : undefined,
      requestedGb: undefined,
    });
  }

  function preferUnlimited(on: boolean) {
    setGbDraft('');
    onChange({ ...profile, activities: [...ticked], usage: on ? 'unlimited' : undefined, requestedGb: undefined });
  }

  function typeGb(raw: string) {
    setGbDraft(raw);
    onChange({ ...profile, activities: [...ticked], usage: undefined, requestedGb: parseRequestedGb(raw) });
  }

  const sum =
    stated !== undefined
      ? interpolate(copy.statedTemplate, { gb: stated })
      : days
        ? interpolate(copy.sumTripTemplate, {
            daily: formatData(daily, locale),
            total: formatData(daily * days, locale),
            days,
          })
        : interpolate(copy.sumTemplate, { daily: formatData(daily, locale) });

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-head text-lg font-semibold">{copy.title}</p>
      <p className="mt-1 text-sm text-ink-2">{copy.note}</p>

      {/* min-w-0: a fieldset's minimum width is its content's by default, so
          at 200% text on a phone the options pushed the page sideways instead
          of wrapping. */}
      <fieldset className="mt-4 min-w-0">
        <legend className="mb-1 font-semibold text-ink">{copy.usageLabel}</legend>
        <p className="mb-2 text-sm text-ink-2">
          {interpolate(copy.baseTemplate, { amount: formatData(BASE_DAILY_MB, locale) })}
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {dataActivities.map((activity) => {
            const on = ticked.includes(activity);
            return (
              <Tick
                key={activity}
                on={on}
                onChange={(next) => tick(activity, next)}
                label={copy.activities[activity]}
                hint={copy.activityHints[activity]}
                figure={interpolate(copy.addsTemplate, {
                  amount: formatData(dailyMbByActivity[activity], locale),
                })}
              />
            );
          })}
        </div>
      </fieldset>

      {/* Said as it changes: the sum is the answer the search will use. */}
      <p
        aria-live="polite"
        className={cn(
          'mt-3 rounded-md border-s-[3px] px-3 py-2 font-semibold',
          stated !== undefined ? 'border-s-line bg-surface text-ink-2' : 'border-s-brand bg-brand-50 text-ink',
        )}
      >
        {sum}
      </p>

      <div className="mt-3 grid gap-2">
        <Tick
          on={unlimited}
          onChange={preferUnlimited}
          label={copy.unlimitedLabel}
          hint={copy.unlimitedHint}
        />

        {/* The traveller who already knows their number. Theirs beats ours. */}
        <div className="rounded-md border border-line bg-surface px-3 py-2.5">
          <label htmlFor={gbFieldId} className="block font-semibold text-ink">
            {copy.exactLabel}
          </label>
          <p id={gbHintId} className="text-sm text-ink-2">
            {copy.exactHint}
          </p>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <input
              id={gbFieldId}
              type="number"
              min={1}
              max={MAX_REQUESTED_GB}
              step="1"
              inputMode="numeric"
              value={gbDraft}
              placeholder={copy.exactPlaceholder}
              aria-describedby={gbHintId}
              onChange={(event) => typeGb(event.target.value)}
              className={cn(
                'tnum h-12 w-28 max-w-full rounded-sm border-2 bg-surface px-2 text-center font-head text-lg font-semibold text-ink',
                stated !== undefined ? 'border-brand' : 'border-line',
              )}
            />
            <span className="text-sm text-ink-2">GB</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** One tick of the calculator: a real checkbox, the whole card its target. */
function Tick({
  on,
  onChange,
  label,
  hint,
  figure,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
  hint: string;
  figure?: string;
}) {
  return (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
        on ? 'border-brand bg-brand-50' : 'border-line bg-surface hover:border-brand',
      )}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-[5px] border-2',
          on ? 'border-brand bg-brand' : 'border-line bg-surface',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
        )}
      >
        {on ? (
          <svg viewBox="0 0 12 12" className="size-3 text-on-brand" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className={cn('block font-semibold', on && 'text-brand')}>{label}</span>
        <span className="block text-sm text-ink-2">{hint}</span>
        {figure ? <span className="mt-0.5 block text-sm text-ink-3">{figure}</span> : null}
      </span>
    </label>
  );
}
