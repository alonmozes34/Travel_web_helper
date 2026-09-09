'use client';

import { useId } from 'react';
import { cn } from '@/components/ui/cn';
import type { Dictionary } from '@/i18n/getDictionary';
import { usageLevels, type TripProfile, type UsageLevel } from '@/lib/types/trip';

/**
 * Optional trip details.
 *
 * Trip length now lives on each destination, so the only question left here is
 * how heavily the traveller uses data. It never gates results — it only
 * sharpens the recommendation.
 *
 * Radio buttons rather than toggle chips: this is one choice out of four, not
 * four independent switches, and the semantics should say so. Each option
 * carries its description on screen — it used to live in a title attribute,
 * which a touch user never sees and a screen reader may never announce.
 */
export function TripPersonalization({
  dict,
  profile,
  onChange,
}: {
  dict: Dictionary;
  profile: TripProfile;
  onChange: (profile: TripProfile) => void;
}) {
  const name = useId();

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-head font-semibold">{dict.personalization.title}</p>
      <p className="mt-1 text-sm text-ink-2">{dict.personalization.note}</p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold text-ink-2">
          {dict.personalization.usageLabel}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {usageLevels.map((level: UsageLevel) => {
            const isActive = profile.usage === level;
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
                  onChange={() => onChange({ ...profile, usage: level })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]',
                    isActive ? 'border-brand' : 'border-line',
                    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
                  )}
                >
                  {isActive ? <span className="size-2 rounded-full bg-brand" /> : null}
                </span>
                <span className="min-w-0">
                  <span className={cn('block font-semibold', isActive && 'text-brand')}>
                    {dict.personalization.usages[level]}
                  </span>
                  <span className="block text-sm text-ink-2">
                    {dict.personalization.usageHints[level]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
