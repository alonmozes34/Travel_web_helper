import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { FairUsage } from '@/lib/types/plan';

/** 1000kbps and up reads as Mbps, the way providers write it. */
export function formatThrottle(kbps: number | null): string {
  if (!kbps) return '—';
  return kbps >= 1000 ? `${Math.round((kbps / 1000) * 10) / 10}Mbps` : `${kbps}kbps`;
}

/**
 * The three sentences a fair-usage cap needs, worded for the period it is
 * counted over. When the provider has not said, the sentence says so instead
 * of assuming "per day".
 */
export function fairUsageCopy(fairUsage: FairUsage, dict: Dictionary) {
  const values = {
    gb: Math.round(((fairUsage.thresholdMb ?? 0) / MB_PER_GB) * 10) / 10,
    speed: formatThrottle(fairUsage.throttledToKbps),
  };
  const scope = fairUsage.per ?? 'unknown';
  const templates = {
    day: [dict.plan.fairUsage, dict.plan.fairUsageDetailTemplate, dict.plan.fairUsageShortDayTemplate],
    plan: [dict.plan.fairUsageCapped, dict.plan.fairUsageDetailPlanTemplate, dict.plan.fairUsageShortPlanTemplate],
    unknown: [dict.plan.fairUsageCapped, dict.plan.fairUsageDetailUnknownTemplate, dict.plan.fairUsageShortUnknownTemplate],
  }[scope];
  return {
    label: templates[0],
    detail: interpolate(templates[1], values),
    short: interpolate(templates[2], values),
  };
}
