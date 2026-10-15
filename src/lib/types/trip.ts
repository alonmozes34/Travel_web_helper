import { getCountryByCode } from '@/data/countries';

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

/**
 * How the traveller intends to use the connection.
 *
 * The range matters more than the granularity: someone navigating with Waze
 * and someone replacing their home broadband with a hotspot are two orders of
 * magnitude apart, and a scale that stops at "heavy" cannot describe the
 * second. `hotspot` exists for the traveller who tethers a laptop and a
 * second phone all day.
 */
export const usageLevels = ['navigation', 'light', 'regular', 'heavy', 'hotspot', 'unlimited'] as const;
export type UsageLevel = (typeof usageLevels)[number];

export function isUsageLevel(value: string): value is UsageLevel {
  return (usageLevels as readonly string[]).includes(value);
}

/**
 * What the traveller will do with the connection, ticked one by one — the
 * calculator that replaced choosing a usage level (the owner, 15 October
 * 2026: fit the plan to how much they actually do). Maps, messages and email
 * are always counted and are not on the list; these are what adds to them.
 *
 * On a profile, `undefined` means the question was not answered and an empty
 * list means maps and messages only. The usage levels stay for two things the
 * calculator does not replace: links made before it, and `unlimited`, which is
 * a preference rather than an amount and is kept next to the ticks.
 */
export const dataActivities = ['social', 'calls', 'video', 'hotspot'] as const;
export type DataActivity = (typeof dataActivities)[number];

export function isDataActivity(value: string): value is DataActivity {
  return (dataActivities as readonly string[]).includes(value);
}

/** Ticked before the traveller touches the calculator: social media and browsing, the old "regular". */
export const DEFAULT_ACTIVITIES: readonly DataActivity[] = ['social'];

/** "Nothing beyond maps and messages" in the address, so an empty list is still an answer. */
const NO_EXTRA_ACTIVITY = 'maps';

/** In the calculator's own order, each once. */
export function normaliseActivities(list: readonly string[]): DataActivity[] {
  return dataActivities.filter((activity) => list.includes(activity));
}

/**
 * The ticks a link made before the calculator stands for, so the calculator
 * can show it. Never less data than the level it replaces: "light" was 250MB
 * a day and the closest ticks come to 600, because recommending too little is
 * the failure that matters.
 */
export const activitiesForUsage: Record<UsageLevel, readonly DataActivity[]> = {
  navigation: [],
  light: ['social'],
  regular: ['social'],
  heavy: ['social', 'calls', 'video'],
  hotspot: ['social', 'calls', 'video', 'hotspot'],
  unlimited: DEFAULT_ACTIVITIES,
};

/** What the calculator shows ticked for this trip. */
export function shownActivities(profile: TripProfile): readonly DataActivity[] {
  if (profile.activities) return profile.activities;
  return profile.usage ? activitiesForUsage[profile.usage] : DEFAULT_ACTIVITIES;
}

/**
 * The trip as the calculator shows it. What it shows ticked is the answer even
 * when nothing was touched: the ticks and the daily figure next to them are on
 * screen, so a search that ran on anything else would not be the one the
 * traveller saw. A GB figure they typed is left as it is.
 */
export function withCalculatorAnswer(profile: TripProfile): TripProfile {
  if (profile.requestedGb !== undefined || profile.activities !== undefined) return profile;
  return {
    ...profile,
    activities: [...shownActivities(profile)],
    usage: profile.usage === 'unlimited' ? 'unlimited' : undefined,
  };
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
  /** A level from a link made before the calculator, or `unlimited` as a preference. */
  usage?: UsageLevel;
  /** What the calculator has ticked; see `dataActivities`. */
  activities?: DataActivity[];
  /**
   * A data figure the traveller stated themselves, in GB for the whole trip.
   * When present it replaces the usage estimate outright: someone who says
   * "I need 100GB" knows something about their trip that no daily average
   * does, and guessing over their answer would be worse than useless.
   */
  requestedGb?: number;
};

/** The largest figure the GB field accepts, guarding the URL against nonsense. */
export const MAX_REQUESTED_GB = 1000;

export function parseRequestedGb(value: string | number | undefined): number | undefined {
  const gb = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
  if (!Number.isFinite(gb) || gb <= 0) return undefined;
  return Math.min(MAX_REQUESTED_GB, Math.round(gb * 10) / 10);
}

/**
 * A trip is described once both the length of every stop and how the
 * connection will be used are known. Until then any recommendation is a guess
 * dressed as an answer, so the search asks for both before it runs.
 */
export function isTripDescribed(profile: TripProfile): boolean {
  if (profile.destinations.length === 0) return false;
  if (profile.destinations.some((destination) => destination.days === undefined)) return false;
  return isUsageAnswered(profile);
}

function isUsageAnswered(profile: TripProfile): boolean {
  return profile.usage !== undefined || profile.requestedGb !== undefined || profile.activities !== undefined;
}

/** What is still missing, so the form can say so rather than just refusing. */
export function missingTripFields(profile: TripProfile): Array<'destination' | 'days' | 'usage'> {
  const missing: Array<'destination' | 'days' | 'usage'> = [];
  if (profile.destinations.length === 0) missing.push('destination');
  else if (profile.destinations.some((destination) => destination.days === undefined)) {
    missing.push('days');
  }
  if (!isUsageAnswered(profile)) missing.push('usage');
  return missing;
}

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
  if (profile.activities) {
    params.set('act', profile.activities.length ? profile.activities.join(',') : NO_EXTRA_ACTIVITY);
  }
  // Next to the ticks, a level means only the preference for unlimited.
  if (profile.usage && (!profile.activities || profile.usage === 'unlimited')) params.set('usage', profile.usage);
  if (profile.requestedGb !== undefined) params.set('gb', String(profile.requestedGb));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Read a trip out of the query string.
 *
 * Two things a URL can carry that the interface cannot produce, and both used
 * to reach the page as if they were real trips:
 *
 * `?to=ZZ:5` rendered "eSIM for ZZ" and then told the traveller we have no
 * package for it — "that does not mean there is no eSIM there, only that it is
 * not in our catalogue" — about two letters that are not a country. A shape
 * test is not an existence test, so the code is now looked up.
 *
 * `?to=TH:5,TH:3` produced "eSIM for Thailand + Thailand", the same stop
 * twice, and eight days of estimated data for a five-day visit. A destination
 * appears once; the first entry for it wins, as the list is ordered.
 */
export function tripProfileFromParams(params: {
  to?: string | string[];
  days?: string | string[];
  usage?: string | string[];
  act?: string | string[];
  gb?: string | string[];
}): TripProfile {
  const profile: TripProfile = { destinations: [] };

  const seen = new Set<string>();
  for (const entry of (first(params.to) ?? '').split(',').filter(Boolean)) {
    const [code, rawDays] = entry.split(':');
    if (!/^[A-Z]{2}$/.test(code)) continue;
    if (!getCountryByCode(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    const days = Number.parseInt(rawDays ?? '', 10);
    profile.destinations.push({
      countryCode: code,
      days: Number.isFinite(days) && days > 0 && days <= 365 ? days : undefined,
    });
  }

  // `?act=bogus` is no answer; `?act=maps` is "maps and messages only".
  const rawActivities = first(params.act);
  if (rawActivities !== undefined) {
    const tokens = rawActivities.split(',').map((token) => token.trim());
    const known = normaliseActivities(tokens);
    if (known.length || tokens.includes(NO_EXTRA_ACTIVITY)) profile.activities = known;
  }

  const rawUsage = first(params.usage);
  if (rawUsage && isUsageLevel(rawUsage) && (!profile.activities || rawUsage === 'unlimited')) {
    profile.usage = rawUsage;
  }

  const gb = parseRequestedGb(first(params.gb));
  if (gb !== undefined) profile.requestedGb = gb;

  return profile;
}

/**
 * Whether two trips would produce the same results page.
 *
 * Used to tell an edited trip from the one currently on screen. Destinations
 * are compared in order, because the order is what the URL carries and what
 * the heading reads back; days and usage because both change which plan fits.
 */
export function sameTrip(a: TripProfile, b: TripProfile): boolean {
  if (a.destinations.length !== b.destinations.length) return false;
  for (const [index, destination] of a.destinations.entries()) {
    const other = b.destinations[index];
    if (destination.countryCode !== other.countryCode) return false;
    if ((destination.days ?? null) !== (other.days ?? null)) return false;
  }
  return (
    (a.usage ?? null) === (b.usage ?? null) &&
    (a.activities?.join(',') ?? null) === (b.activities?.join(',') ?? null) &&
    (a.requestedGb ?? null) === (b.requestedGb ?? null)
  );
}
