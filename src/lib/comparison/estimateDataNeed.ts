import { MB_PER_GB } from '@/lib/formatters/data';
import type { TripProfile, UsageLevel } from '@/lib/types/trip';

/**
 * Daily data assumptions, in MB.
 *
 * These are the only place the estimate is tuned, and they are deliberately
 * conservative rather than flattering: recommending a plan that runs out is a
 * far worse failure than recommending one gigabyte too many.
 */
export const dailyDataMbByUsage: Record<UsageLevel, number> = {
  light: 250,
  regular: 600,
  heavy: 1500,
  unlimited: 1500,
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
  const dailyMb = dailyDataMbByUsage[usage];

  const destinations = profile.destinations.length
    ? profile.destinations
    : [{ countryCode: '', days: undefined }];

  const legs: LegEstimate[] = destinations.map((destination) => {
    const days = destination.days ?? DEFAULT_LEG_DAYS;
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
    legs,
    days,
    requiredMb,
    requiredGb: requiredMb / MB_PER_GB,
    isDefault: profile.usage === undefined && legs.every((leg) => leg.isAssumedLength),
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
