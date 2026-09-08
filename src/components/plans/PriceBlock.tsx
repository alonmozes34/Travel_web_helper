import { Ltr } from '@/components/ui/Bdi';
import { cn } from '@/components/ui/cn';
import { currencyConfig, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { formatPrice } from '@/lib/formatters/price';

/**
 * Price.
 *
 * The large number is the amount the provider actually charges, in the
 * currency it charges in. That figure can be checked against the provider's
 * own page and can never be wrong.
 *
 * The converted amount sits underneath, smaller, always prefixed with "≈" and
 * labelled as an estimate — because it will differ from what the traveller is
 * billed: exchange rates move, and card issuers convert at their own rate and
 * add a foreign-transaction fee. Comparison and sorting still run on the
 * converted figure, which is what makes plans priced in different currencies
 * comparable at all.
 */
export function PriceBlock({
  row,
  locale,
  dict,
  size = 'row',
}: {
  row: ComparisonRow;
  locale: Locale;
  dict: Dictionary;
  size?: 'row' | 'card';
}) {
  const { price, originalPrice } = row;

  const charged = formatPrice(price.sourceAmountMinor, price.sourceCurrency, locale);
  const chargedBefore = originalPrice
    ? formatPrice(originalPrice.sourceAmountMinor, originalPrice.sourceCurrency, locale)
    : null;

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <Ltr
          className={cn(
            'tnum font-head font-bold tracking-tight',
            size === 'row' ? 'text-2xl' : 'text-xl',
          )}
        >
          {charged}
        </Ltr>
        {chargedBefore ? (
          <Ltr className="tnum text-[0.8125rem] text-ink-3 line-through">{chargedBefore}</Ltr>
        ) : null}
      </div>

      {price.isConverted ? (
        <p
          className="text-[0.8125rem] text-ink-3"
          title={[
            dict.plan.conversionNote,
            price.fxRate && price.fxAsOf
              ? interpolate(dict.plan.fxNoteTemplate, { rate: price.fxRate, date: price.fxAsOf })
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Ltr className="tnum">
            {interpolate(dict.plan.approxTemplate, {
              price: formatPrice(price.amountMinor, price.currency, locale),
            })}
          </Ltr>
          <span className="ms-1">· {dict.plan.estimateOnly}</span>
        </p>
      ) : (
        <p className="text-[0.8125rem] text-ink-3">
          {interpolate(dict.plan.chargedHereTemplate, {
            currency: currencyConfig[price.sourceCurrency].label,
          })}
        </p>
      )}
    </div>
  );
}
