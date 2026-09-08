'use client';

import { Chip } from '@/components/ui/Chip';
import { Ltr } from '@/components/ui/Bdi';
import type { Dictionary } from '@/i18n/getDictionary';
import {
  daysForDuration,
  durationForDays,
  tripDurationKeys,
  usageLevels,
  type TripProfile,
  type UsageLevel,
} from '@/lib/types/trip';

/**
 * Optional trip details.
 *
 * This never gates results — it only sharpens the recommendation. Two
 * questions, one row of chips each, and both can be left untouched.
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
  const activeDuration = profile.days ? durationForDays(profile.days) : undefined;

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-head font-semibold">{dict.personalization.title}</p>
      <p className="mt-1 text-[0.8125rem] text-ink-2">{dict.personalization.note}</p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
          {dict.personalization.durationLabel}
        </legend>
        <div className="flex flex-wrap gap-2">
          {tripDurationKeys.map((key) => {
            const isActive = activeDuration === key;
            return (
              <Chip
                key={key}
                selected={isActive}
                onClick={() =>
                  onChange({ ...profile, days: isActive ? undefined : daysForDuration(key) })
                }
              >
                <Ltr>{dict.personalization.durations[key]}</Ltr>
              </Chip>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
          {dict.personalization.usageLabel}
        </legend>
        <div className="flex flex-wrap gap-2">
          {usageLevels.map((level: UsageLevel) => {
            const isActive = profile.usage === level;
            return (
              <Chip
                key={level}
                selected={isActive}
                title={dict.personalization.usageHints[level]}
                onClick={() => onChange({ ...profile, usage: isActive ? undefined : level })}
              >
                {dict.personalization.usages[level]}
              </Chip>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
