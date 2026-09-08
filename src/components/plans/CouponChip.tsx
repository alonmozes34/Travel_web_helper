import { Ltr } from '@/components/ui/Bdi';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { formatPrice } from '@/lib/formatters/price';
import { isPresentableDiscount } from '@/lib/types/discount';

/**
 * Discount code and what it saves.
 *
 * A mock code is only rendered when demo data is switched on, and it is
 * labelled as a demo code so it can never read as a real offer.
 */
export function CouponChip({
  row,
  locale,
  dict,
  demoDataEnabled,
}: {
  row: ComparisonRow;
  locale: Locale;
  dict: Dictionary;
  demoDataEnabled: boolean;
}) {
  const { discount } = row.plan;
  if (!isPresentableDiscount(discount, demoDataEnabled) || !row.originalPrice) return null;

  const savings = row.originalPrice.sourceAmountMinor - row.price.sourceAmountMinor;
  if (savings <= 0) return null;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-xs bg-teal-50 px-2 py-1 text-[0.8125rem] font-semibold whitespace-nowrap text-teal-ink"
      title={discount!.source === 'mock' ? dict.plan.demoCoupon : undefined}
    >
      <span aria-hidden="true">🏷️</span>
      <Ltr className="tnum">
        {interpolate(dict.plan.couponTemplate, {
          code: discount!.code,
          amount: formatPrice(savings, row.price.sourceCurrency, locale),
        })}
      </Ltr>
      {discount!.source === 'mock' ? (
        <span className="font-normal text-warn-ink">·&nbsp;{dict.plan.demoCoupon}</span>
      ) : null}
    </span>
  );
}
