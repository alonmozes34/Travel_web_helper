/**
 * The traveller's trip profile. Both fields are optional: results are always
 * shown, and answering only sharpens the recommendation.
 */
export const tripDurationKeys = ['short', 'week', 'twoWeeks', 'month'] as const;
export type TripDurationKey = (typeof tripDurationKeys)[number];

/**
 * `days` is what the recommendation scorer actually consumes; the buckets are
 * only a fast way for a traveller to express it. The representative value is
 * the top of each bucket, so a plan is never recommended that runs out a day
 * early.
 */
export const tripDurations: Record<TripDurationKey, { min: number; max: number }> = {
  short: { min: 1, max: 3 },
  week: { min: 4, max: 7 },
  twoWeeks: { min: 8, max: 14 },
  month: { min: 15, max: 30 },
};

export function daysForDuration(key: TripDurationKey): number {
  return tripDurations[key].max;
}

export function durationForDays(days: number): TripDurationKey | undefined {
  return tripDurationKeys.find(
    (key) => days >= tripDurations[key].min && days <= tripDurations[key].max,
  );
}

export const usageLevels = ['light', 'regular', 'heavy', 'unlimited'] as const;
export type UsageLevel = (typeof usageLevels)[number];

export function isUsageLevel(value: string): value is UsageLevel {
  return (usageLevels as readonly string[]).includes(value);
}

export type TripProfile = {
  days?: number;
  usage?: UsageLevel;
};

/** Serialise a trip profile into search params: `?days=14&usage=regular`. */
export function tripProfileToQuery(profile: TripProfile): string {
  const params = new URLSearchParams();
  if (profile.days) params.set('days', String(profile.days));
  if (profile.usage) params.set('usage', profile.usage);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function tripProfileFromParams(params: {
  days?: string | string[];
  usage?: string | string[];
}): TripProfile {
  const rawDays = Array.isArray(params.days) ? params.days[0] : params.days;
  const rawUsage = Array.isArray(params.usage) ? params.usage[0] : params.usage;

  const days = rawDays ? Number.parseInt(rawDays, 10) : Number.NaN;
  const profile: TripProfile = {};

  if (Number.isFinite(days) && days > 0 && days <= 365) profile.days = days;
  if (rawUsage && isUsageLevel(rawUsage)) profile.usage = rawUsage;

  return profile;
}
