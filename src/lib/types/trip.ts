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

/**
 * One stop on the trip. Days are per destination because a night in Germany
 * and two weeks in the States are not the same purchase, and sizing both legs
 * off one total would over-buy for the short one.
 */
export type TripDestination = {
  countryCode: string;
  days?: number;
};

export type TripProfile = {
  destinations: TripDestination[];
  usage?: UsageLevel;
};

export const emptyTripProfile: TripProfile = { destinations: [] };

/** Total nights across every stop, when they have all been given. */
export function totalTripDays(profile: TripProfile): number | undefined {
  const days = profile.destinations.map((destination) => destination.days);
  if (days.length === 0 || days.some((value) => value === undefined)) return undefined;
  return days.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function destinationCodes(profile: TripProfile): string[] {
  return profile.destinations.map((destination) => destination.countryCode);
}

/**
 * Destinations serialise as `?to=DE:1,US:14`, so a multi-stop search is one
 * shareable link. A stop without a day count is written as just its code.
 */
export function tripProfileToQuery(profile: TripProfile): string {
  const params = new URLSearchParams();
  if (profile.destinations.length) {
    params.set(
      'to',
      profile.destinations
        .map((d) => (d.days ? `${d.countryCode}:${d.days}` : d.countryCode))
        .join(','),
    );
  }
  if (profile.usage) params.set('usage', profile.usage);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function tripProfileFromParams(params: {
  to?: string | string[];
  days?: string | string[];
  usage?: string | string[];
}): TripProfile {
  const profile: TripProfile = { destinations: [] };

  for (const entry of (first(params.to) ?? '').split(',').filter(Boolean)) {
    const [code, rawDays] = entry.split(':');
    if (!/^[A-Z]{2}$/.test(code)) continue;
    const days = Number.parseInt(rawDays ?? '', 10);
    profile.destinations.push({
      countryCode: code,
      days: Number.isFinite(days) && days > 0 && days <= 365 ? days : undefined,
    });
  }

  const rawUsage = first(params.usage);
  if (rawUsage && isUsageLevel(rawUsage)) profile.usage = rawUsage;

  return profile;
}
