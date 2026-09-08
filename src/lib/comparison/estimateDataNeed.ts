import { MB_PER_GB } from '@/lib/formatters/data';
import type { TripProfile, UsageLevel } from '@/lib/types/trip';

/**
 * Daily data assumptions, in MB.
 *
 * These are the only place the estimate is tuned, and they are deliberately
 * conservative rather than flattering: recommending a plan that runs out is a
 * far worse failure than recommending one gigabyte too many.
 *
 * light    messaging, navigation, email
 * regular  social media, maps, general browsing
 * heavy    video, hotspot, frequent use
 * unlimited a stated preference, scored as heavy usage
 */
export const dailyDataMbByUsage: Record<UsageLevel, number> = {
  light: 250,
  regular: 600,
  heavy: 1500,
  unlimited: 1500,
};

/**
 * Used when the traveller skips personalisation. Results are never withheld,
 * so the recommendation still needs a profile to reason about — a one-week
 * regular trip is the median case, and the UI says the estimate is a default.
 */
export const neutralTripProfile: Required<Pick<TripProfile, 'days' | 'usage'>> = {
  days: 7,
  usage: 'regular',
};

export type DataNeedEstimate = {
  days: number;
  usage: UsageLevel;
  dailyMb: number;
  requiredMb: number;
  requiredGb: number;
  /** True when the traveller has not told us about their trip. */
  isDefault: boolean;
  prefersUnlimited: boolean;
};

export function estimateDataNeed(profile: TripProfile = {}): DataNeedEstimate {
  const days = profile.days ?? neutralTripProfile.days;
  const usage = profile.usage ?? neutralTripProfile.usage;
  const dailyMb = dailyDataMbByUsage[usage];
  const requiredMb = days * dailyMb;

  return {
    days,
    usage,
    dailyMb,
    requiredMb,
    requiredGb: requiredMb / MB_PER_GB,
    isDefault: profile.days === undefined && profile.usage === undefined,
    prefersUnlimited: usage === 'unlimited',
  };
}
