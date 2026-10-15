import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { formatData } from '@/lib/formatters/data';
import type { DataNeedEstimate } from './estimateDataNeed';

/**
 * The line over the results that says what they were fitted to. A figure the
 * traveller typed is reported back as theirs; the calculator's is reported as
 * the daily amount it added up to, the number that was on screen when they
 * searched; a level from an older link keeps its own name.
 */
export function estimateSummary(estimate: DataNeedEstimate, dict: Dictionary, locale: Locale): string {
  const copy = dict.results;
  if (estimate.isStatedByTraveller) {
    return interpolate(copy.tailoredStatedTemplate, { days: estimate.days, gb: Math.round(estimate.requiredGb) });
  }
  if (estimate.activities) {
    const daily = formatData(estimate.dailyMb, locale);
    return estimate.prefersUnlimited
      ? interpolate(copy.tailoredUnlimitedTemplate, { days: estimate.days, daily })
      : interpolate(copy.tailoredActivitiesTemplate, {
          days: estimate.days,
          daily,
          total: formatData(estimate.requiredMb, locale),
        });
  }
  return interpolate(copy.tailoredTemplate, {
    days: estimate.days,
    usage: dict.personalization.usages[estimate.usage],
    gb: Math.round(estimate.requiredGb),
  });
}
