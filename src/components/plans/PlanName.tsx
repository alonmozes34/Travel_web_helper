import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { formatData } from '@/lib/formatters/data';

/**
 * What a screen reader calls a plan: "Yesim: 10GB, 30 days". The card's
 * hidden heading says it, and so does the before-you-go sheet, which needs a
 * copy of its own: a modal dialog makes the page behind it inert, and a link
 * in the dialog described by the card's heading is read with no description
 * at all (Chrome, 8 October 2026). The provider's name is Latin, marked so
 * the reader can switch voice.
 */
export function PlanName({ row, dict, locale }: { row: ComparisonRow; dict: Dictionary; locale: Locale }) {
  const { plan } = row;
  const data = plan.isUnlimited ? dict.units.unlimited : formatData(plan.dataAmountMb, locale);
  const days = `${plan.validityDays} ${plan.validityDays === 1 ? dict.units.day : dict.units.days}`;
  const [before, after = ''] = dict.results.cardHeadingTemplate.split('{provider}');
  return (
    <>
      {before}
      <span lang="en">{row.provider.name}</span>
      {interpolate(after, { data, days })}
    </>
  );
}
