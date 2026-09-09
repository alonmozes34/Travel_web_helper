import { MB_PER_GB } from '@/lib/formatters/data';
import type { TripProfile, UsageLevel } from '@/lib/types/trip';

/**
 * Daily data assumptions, in MB.
 *
 * These are the only place the estimate is tuned, and they are deliberately
 * conservative rather than flattering: recommending a plan that runs out is a
 * far worse failure than recommending one gigabyte too many.
 *
 * They are our assumptions, not measurements, so the interface shows each
 * figure next to its option — a traveller who knows their own consumption can
 * see immediately whether ours matches, and override it with a GB number if
 * it does not.
 *
 * The top of the range is the reason the scale exists at all: a phone used
 * for navigation and a phone tethering a laptop all day are twenty times
 * apart, and one number in the middle serves neither.
 */
export const dailyDataMbByUsage: Record<UsageLevel, number> = {
  navigation: 150,
  light: 250,
  regular: 600,
  heavy: 1500,
  hotspot: 4 * MB_PER_GB,
  unlimited: 4 * MB_PER_GB,
};

/** Used for a stop whose length the traveller has not given. */
export const DEFAULT_LEG_DAYS = 7;
export const DEFAULT_USAGE: UsageLevel = 'regular';

/** The estimate for one stop on the trip. */
export type LegEstimate = {
  countryCode: string;
  days: number;
  requiredMb: number;
  requiredGb: number;
  /** True when the length was assumed rather than given. */
  isAssumedLength: boolean;
};

export type DataNeedEstimate = {
  usage: UsageLevel;
  dailyMb: number;
  /** True when the traveller gave a GB figure instead of picking a usage. */
  isStatedByTraveller: boolean;
  legs: LegEstimate[];
  /** Sum across every stop. */
  days: number;
  requiredMb: number;
  requiredGb: number;
  /** True when the traveller has told us nothing about the trip. */
  isDefault: boolean;
  prefersUnlimited: boolean;
};

/**
 * Estimate data need per stop and in total.
 *
 * Sizing every leg off the whole trip would over-buy for the short ones — a
 * night in Germany does not need two weeks' worth of data — so each stop is
 * estimated on its own and the totals are derived from the legs.
 */
export function estimateDataNeed(profile: TripProfile): DataNeedEstimate {
  const usage = profile.usage ?? DEFAULT_USAGE;

  const destinations = profile.destinations.length
    ? profile.destinations
    : [{ countryCode: '', days: undefined }];

  const dayCounts = destinations.map((destination) => destination.days ?? DEFAULT_LEG_DAYS);
  const totalDays = dayCounts.reduce((sum, value) => sum + value, 0);

  // A stated GB figure wins over any daily average. It is spread across the
  // stops in proportion to their length, so a night in Germany is not sized
  // like a fortnight in the States — the same reason the legs exist at all.
  const statedMb =
    profile.requestedGb !== undefined ? profile.requestedGb * MB_PER_GB : null;
  const dailyMb = statedMb !== null && totalDays > 0
    ? statedMb / totalDays
    : dailyDataMbByUsage[usage];

  const legs: LegEstimate[] = destinations.map((destination, index) => {
    const days = dayCounts[index];
    const requiredMb = days * dailyMb;
    return {
      countryCode: destination.countryCode,
      days,
      requiredMb,
      requiredGb: requiredMb / MB_PER_GB,
      isAssumedLength: destination.days === undefined,
    };
  });

  const days = legs.reduce((sum, leg) => sum + leg.days, 0);
  const requiredMb = legs.reduce((sum, leg) => sum + leg.requiredMb, 0);

  return {
    usage,
    dailyMb,
    isStatedByTraveller: statedMb !== null,
    legs,
    days,
    requiredMb,
    requiredGb: requiredMb / MB_PER_GB,
    isDefault:
      profile.usage === undefined &&
      profile.requestedGb === undefined &&
      legs.every((leg) => leg.isAssumedLength),
    prefersUnlimited: usage === 'unlimited',
  };
}

/** The estimate for a single stop, used when pricing one leg of a combination. */
export function legEstimate(estimate: DataNeedEstimate, countryCode: string): DataNeedEstimate {
  const leg = estimate.legs.find((entry) => entry.countryCode === countryCode) ?? estimate.legs[0];
  return {
    ...estimate,
    legs: [leg],
    days: leg.days,
    requiredMb: leg.requiredMb,
    requiredGb: leg.requiredGb,
  };
}
