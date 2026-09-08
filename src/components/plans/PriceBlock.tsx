import { Ltr } from '@/components/ui/Bdi';
import { cn } from '@/components/ui/cn';
import type { Locale } from '@/i18n/config';
import { currencyConfig } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { formatPrice } from '@/lib/formatters/price';

/**
 * Price is the largest thing in the row. Everything qualifying it — the
 * pre-discount price, the source-currency amount, the rate — is deliberately
 * smaller and quieter, but never hidden.
 *
 * A converted price always says the provider charges in its own currency, so
 * nobody arrives at checkout expecting the shekel figure.
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

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-baseline gap-2">
        <Ltr
          className={cn(
            'tnum font-head font-bold tracking-tight',
            size === 'row' ? 'text-2xl' : 'text-xl',
          )}
        >
          {formatPrice(price.amountMinor, price.currency, locale)}
        </Ltr>
        {originalPrice ? (
          <Ltr className="tnum text-[0.8125rem] text-ink-3 line-through">
            {formatPrice(originalPrice.amountMinor, originalPrice.currency, locale)}
          </Ltr>
        ) : null}
      </div>

      {price.isConverted ? (
        <p className="text-[0.8125rem] text-ink-3">
          <Ltr
            className="tnum underline decoration-dotted"
            title={[
              interpolate(dict.plan.chargedInTemplate, {
                currency: currencyConfig[price.sourceCurrency].label,
              }),
              price.fxRate && price.fxAsOf
                ? interpolate(dict.plan.fxNoteTemplate, { rate: price.fxRate, date: price.fxAsOf })
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          >
            {interpolate(dict.plan.approxTemplate, {
              price: formatPrice(price.sourceAmountMinor, price.sourceCurrency, locale),
            })}
          </Ltr>
        </p>
      ) : null}
    </div>
  );
}
