import { Fragment, type ReactNode } from 'react';
import { Ltr } from '@/components/ui/Bdi';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { formatPrice } from '@/lib/formatters/price';
import { isPresentableDiscount, type Discount } from '@/lib/types/discount';

/**
 * Discount code and what it saves.
 *
 * A mock code is only rendered when demo data is switched on, and it is
 * labelled as a demo code so it can never read as a real offer.
 *
 * A code a provider issued for this site's visitors says who it is for. One
 * every visitor can use is already in the price above it, so the chip shows
 * the saving. One only for new customers is not in the price, so the chip says
 * "first purchase" and shows no saving against a price nobody was charged.
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
  if (!isPresentableDiscount(discount, demoDataEnabled)) return null;

  if (discount!.source === 'affiliate') {
    return <PromotionChip row={row} discount={discount!} locale={locale} dict={dict} />;
  }

  if (!row.originalPrice) return null;
  const savings = row.originalPrice.sourceAmountMinor - row.price.sourceAmountMinor;
  if (savings <= 0) return null;

  return (
    <Chip>
      <Ltr className="tnum">
        {interpolate(dict.plan.couponTemplate, {
          code: discount!.code,
          amount: formatPrice(savings, row.price.sourceCurrency, locale),
        })}
      </Ltr>
      <span className="font-normal text-warn-ink">·&nbsp;{dict.plan.demoCoupon}</span>
    </Chip>
  );
}

function PromotionChip({
  row,
  discount,
  locale,
  dict,
}: {
  row: ComparisonRow;
  discount: Discount;
  locale: Locale;
  dict: Dictionary;
}) {
  const forEveryone = discount.audience === 'everyone';
  const savings = row.originalPrice
    ? row.originalPrice.sourceAmountMinor - row.price.sourceAmountMinor
    : 0;
  // A code for everyone is only claimed once it is visibly in the price.
  if (forEveryone && savings <= 0) return null;

  const parts: ReactNode[] = [
    fill(forEveryone ? dict.plan.sitePromoTemplate : dict.plan.firstPurchasePromoTemplate, {
      percent: <Ltr className="tnum">{`${discount.percent}%`}</Ltr>,
    }),
    discount.appliedByLink
      ? dict.plan.promoInLink
      : fill(dict.plan.promoCodeTemplate, { code: <Ltr>{discount.code}</Ltr> }),
  ];
  if (forEveryone) {
    parts.push(
      fill(dict.plan.promoSavingTemplate, {
        amount: <Ltr className="tnum">{formatPrice(savings, row.price.sourceCurrency, locale)}</Ltr>,
      }),
    );
  }

  return (
    <Chip>
      {parts.map((part, index) => (
        <span key={index}>
          {/* The dot is for the eye; a screen reader gets a comma, or the
              parts run together into one word across the flex gap. */}
          {index > 0 ? (
            <>
              <span aria-hidden="true">·&nbsp;</span>
              <VisuallyHidden>, </VisuallyHidden>
            </>
          ) : null}
          {part}
        </span>
      ))}
    </Chip>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      // The code itself must not break mid-string, but the chip as a whole
      // has to be allowed to wrap onto a second line — held on one line it is
      // the widest thing on the card and pushes a 320px screen sideways.
      className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-xs bg-teal-50 px-2 py-1 text-sm font-semibold text-teal-ink"
    >
      <span aria-hidden="true">🏷️</span>
      {children}
    </span>
  );
}

/**
 * `interpolate`, but the values are elements. The sentence around them stays in
 * the page's own direction, and only the code, percentage and amount are
 * isolated left-to-right — wrapping the whole line would read backwards in
 * Hebrew.
 */
function fill(template: string, values: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={index}>{key && key in values ? values[key] : piece}</Fragment>;
  });
}
