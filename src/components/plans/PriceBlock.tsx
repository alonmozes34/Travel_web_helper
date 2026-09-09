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
 * Two numbers, both large, both labelled — because the traveller has two
 * different questions and the old layout only answered one of them.
 *
 * "What does this cost me?" is answered in shekels, because that is the
 * currency they think in. "What will actually appear on my card?" is answered
 * in the provider's currency, at the same size, right beside it: that figure
 * can be checked against the provider's own page and can never be wrong.
 *
 * Neither is hidden. The earlier version demoted the shekel to small grey
 * text with "estimate only" attached, which protected us from complaints about
 * conversion at the cost of making the price unreadable to anyone who does not
 * price their holiday in dollars. The honest disclosure stays — it is just no
 * longer doing its job by being illegible.
 *
 * Comparison and sorting still run on the converted figure, which is what
 * makes plans priced in different currencies comparable at all.
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
  const home = formatPrice(price.amountMinor, price.currency, locale);
  // When the big number is in shekels the struck-out "before" must be too, or
  // the card shows a discount from one currency to another.
  const homeBefore = originalPrice
    ? formatPrice(originalPrice.amountMinor, originalPrice.currency, locale)
    : null;
  const big = size === 'row' ? 'text-3xl' : 'text-2xl';

  // Not converted: the provider bills in the traveller's own currency, so
  // there is one number and nothing to reconcile.
  if (!price.isConverted) {
    return (
      <div className="grid gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <Ltr className={cn('tnum font-head font-bold tracking-tight', big)}>{charged}</Ltr>
          {chargedBefore ? (
            <Ltr className="tnum text-base text-ink-2 line-through">{chargedBefore}</Ltr>
          ) : null}
        </div>
        <p className="text-sm text-ink-2">
          {interpolate(dict.plan.chargedHereTemplate, {
            currency: currencyConfig[price.sourceCurrency].label,
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div>
        <span className="block text-sm text-ink-2">{dict.plan.youPayLabel}</span>
        <div className="flex flex-wrap items-baseline gap-2">
          {/* The "≈" belongs in the label, not glued to the number: inside an
              LTR run it lands on the wrong side of a Hebrew line, and it is a
              symbol many readers do not know. The label says "roughly". */}
          <Ltr className={cn('tnum font-head font-bold tracking-tight', big)}>{home}</Ltr>
          {homeBefore ? (
            <Ltr className="tnum text-base text-ink-2 line-through">{homeBefore}</Ltr>
          ) : null}
        </div>
      </div>

      {/* The explanation of why the two differ is on the page once, above the
          results — repeating it on every card would bury the numbers again. */}
      <div className="rounded-sm bg-surface-2 px-2.5 py-1.5">
        <span className="block text-sm text-ink-2">{dict.plan.chargedLabel}</span>
        <div className="flex flex-wrap items-baseline gap-2">
          <Ltr className="tnum font-head text-xl font-semibold">{charged}</Ltr>
          {chargedBefore ? (
            <Ltr className="tnum text-sm text-ink-2 line-through">{chargedBefore}</Ltr>
          ) : null}
        </div>
      </div>
    </div>
  );
}
