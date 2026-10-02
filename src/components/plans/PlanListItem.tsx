'use client';

import { useId, useState } from 'react';
import { Ltr } from '@/components/ui/Bdi';
import { cn } from '@/components/ui/cn';
import { Badge } from '@/components/ui/Badge';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { recommendationKeys, type RecommendationKey } from '@/lib/comparison/recommend';
import { formatData } from '@/lib/formatters/data';
import { formatPrice } from '@/lib/formatters/price';
import { CompareToggle } from './CompareToggle';
import { CouponChip } from './CouponChip';
import { CoverageNote } from './CoverageNote';
import { DataFact, FairUsageNote, NetworkFact, ValidityFact } from './PlanFacts';
import { PlanCta } from './PlanCta';
import { PlanDetails } from './PlanDetails';
import { ProviderCell } from './ProviderCell';
import { ShareSearch } from '@/components/results/ShareSearch';

const badgeIcons: Record<RecommendationKey, string> = {
  cheapest: '💰',
  bestForBrowsing: '📶',
  bestUnlimited: '♾️',
};

/**
 * One result.
 *
 * The card answers the three questions a traveller chooses on — how much, how
 * many days, how many gigabytes — and one more: is it enough for this trip.
 * That, the price, and one button are all it shows. Everything else (the
 * network, hotspot, calls, per-GB price, the plan's name at the provider, how
 * it was scored, the comparison checkbox) is behind "more details", because
 * the owner watched people get lost in cards that showed fifteen facts at
 * once, most of them "not stated".
 *
 * Two things stay on the face of the card although they are not price, days
 * or data, because they change the decision: a warning when an unlimited plan
 * slows down, and a provider's discount code.
 */
export function PlanListItem({
  row,
  locale,
  dict,
  tripDays,
  countryCodes = [],
  demoDataEnabled,
  demoDataMixed = false,
  isSelected,
  canSelect,
  onSelect,
  onChosen,
}: {
  row: ComparisonRow;
  locale: Locale;
  dict: Dictionary;
  tripDays: number;
  countryCodes?: string[];
  demoDataEnabled: boolean;
  /** True while real and demo plans share the page. */
  demoDataMixed?: boolean;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: (selected: boolean) => void;
  /** Raised when this row's outbound link is followed. */
  onChosen?: () => void;
}) {
  const { plan } = row;
  // One label, not four: the first category the plan wins, in the order the
  // tabs above list them.
  const badge = recommendationKeys.find((key) => row.badges.includes(key));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  const status = !row.coversTrip
    ? { tone: 'warn' as const, text: dict.plan.shortValidity }
    : row.isBelowEstimatedNeed && row.daysOfData !== null
      ? {
          tone: 'warn' as const,
          text:
            row.daysOfData === 1
              ? dict.plan.dataDaysOneTemplate
              : interpolate(dict.plan.dataDaysTemplate, { days: row.daysOfData }),
        }
      : { tone: 'ok' as const, text: dict.plan.fitsTrip };

  return (
    <article
      className={cn(
        // min-w-0: a grid item otherwise refuses to shrink below its longest
        // word and pushes a 320px screen sideways.
        'relative min-w-0 rounded-lg border border-line bg-surface p-4 md:p-5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* The plan's own name is under "more details": the button opens the
            plan itself, so nobody has to find it by name any more. */}
        <ProviderCell row={row} showPlanName={false} />
        <div className="flex flex-wrap gap-1.5">
          {demoDataMixed && plan.source === 'mock' ? (
            <Badge tone="warn">
              <span aria-hidden="true">⚠︎</span>
              {dict.mockData.badge}
            </Badge>
          ) : null}
          {badge ? (
            <Badge tone="brand">
              <span aria-hidden="true">{badgeIcons[badge]}</span>
              {dict.recommendations[badge]}
            </Badge>
          ) : null}
        </div>
      </div>
      <CoverageNote coverage={plan.coverage} locale={locale} dict={dict} />

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6">
        <div className="min-w-0">
          {/* The two numbers people compare, as one line they can scan down
              the list: "50GB · 10 days". */}
          <p className="font-head text-2xl font-bold tracking-tight">
            {plan.isUnlimited ? (
              dict.units.unlimited
            ) : (
              <Ltr className="tnum">{formatData(plan.dataAmountMb, locale)}</Ltr>
            )}
            {/* Real spaces around the dot, not margins: with margins alone
                "Unlimited·7" had no place to wrap and pushed a 390px screen
                sideways at 200% text. */}{' '}
            <span aria-hidden="true" className="text-ink-3">
              ·
            </span>
            <span className="sr-only">, </span>{' '}
            <Ltr className="tnum">{plan.validityDays}</Ltr>{' '}
            {plan.validityDays === 1 ? dict.units.day : dict.units.days}
          </p>
          <p className={cn('mt-1 text-base', status.tone === 'ok' ? 'text-teal-ink' : 'text-warn-ink')}>
            {status.tone === 'ok' ? <span aria-hidden="true">✓ </span> : <span aria-hidden="true">⚠︎ </span>}
            {status.text}
          </p>
          <FairUsageNote row={row} dict={dict} />
        </div>

        <div className="grid gap-1 md:justify-items-end">
          <PriceSummary row={row} locale={locale} dict={dict} />
          <PriceTrendNote row={row} locale={locale} dict={dict} />
        </div>
      </div>

      <div className="mt-2">
        <CouponChip row={row} locale={locale} dict={dict} demoDataEnabled={demoDataEnabled} />
      </div>

      <div className="mt-3">
        <PlanCta
          row={row}
          dict={dict}
          locale={locale}
          size="md"
          detailsOpen={detailsOpen}
          detailsId={detailsId}
          onToggleDetails={() => setDetailsOpen((open) => !open)}
          onChosen={onChosen}
          demoDataEnabled={demoDataEnabled}
          share={
            <ShareSearch
              compact
              message={interpolate(dict.share.planMessageTemplate, {
                provider: row.provider.name,
                data: plan.isUnlimited ? dict.units.unlimited : formatData(plan.dataAmountMb, locale),
                days: plan.validityDays,
                // First-strong isolates, so "₪52.30" keeps its order inside Hebrew.
                price: '\u2068' + formatPrice(row.price.amountMinor, row.price.currency, locale) + '\u2069',
              })}
              label={dict.share.whatsapp}
              opensInNewTab={dict.share.opensInNewTab}
              context={`${row.provider.name}, ${plan.isUnlimited ? dict.units.unlimited : formatData(plan.dataAmountMb, locale)}, ${plan.validityDays} ${dict.units.days}`}
            />
          }
        />
      </div>

      {detailsOpen ? (
        <div id={detailsId} className="mt-4 border-t border-line-soft pt-4">
          <div className="grid gap-1">
            <p className="text-sm text-ink-2">
              {dict.plan.planNameLabel}: <Ltr className="font-semibold text-ink">{plan.planName}</Ltr>
            </p>
            <ProviderPrice row={row} locale={locale} dict={dict} />
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 md:grid-cols-3">
            <DataFact row={row} locale={locale} dict={dict} />
            <ValidityFact row={row} dict={dict} tripDays={tripDays} />
            <div className="col-span-2 md:col-span-1">
              <NetworkFact row={row} dict={dict} countryCodes={countryCodes} />
            </div>
          </div>
          <PlanDetails row={row} dict={dict} />
          <div className="mt-3">
            <CompareToggle
              checked={isSelected}
              disabled={!isSelected && !canSelect}
              onChange={onSelect}
              dict={dict}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

/**
 * The price, once, in the currency the traveller chose — nothing else in
 * money on the face of the card. The owner: a second figure in dollars or
 * pounds under the shekel price confused more than it told. The provider's own
 * figure is under "more details" (`ProviderPrice`), and "about" says the
 * shekel figure is a conversion.
 */
function PriceSummary({ row, locale, dict }: { row: ComparisonRow; locale: Locale; dict: Dictionary }) {
  const { price, originalPrice } = row;
  const home = formatPrice(price.amountMinor, price.currency, locale);
  const homeBefore = originalPrice ? formatPrice(originalPrice.amountMinor, originalPrice.currency, locale) : null;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 md:justify-end">
      {price.isConverted ? <span className="text-sm text-ink-2">{dict.plan.approxShort}</span> : null}
      <Ltr className="tnum font-head text-3xl font-bold tracking-tight">{home}</Ltr>
      {homeBefore ? <Ltr className="tnum text-base text-ink-2 line-through">{homeBefore}</Ltr> : null}
    </div>
  );
}

/**
 * What our price history says, in the provider's own currency: a drop since
 * the last day we recorded, or the lowest in N days. Nothing until there is
 * history to say it from.
 */
function PriceTrendNote({ row, locale, dict }: { row: ComparisonRow; locale: Locale; dict: Dictionary }) {
  const trend = row.trend;
  if (!trend) return null;
  const text =
    trend.kind === 'dropped'
      ? interpolate(dict.plan.priceDroppedTemplate, {
          // First-strong isolates, so "$27.50" keeps its order inside Hebrew.
          before: '\u2068' + formatPrice(trend.previousMinor, trend.currency, locale) + '\u2069',
          date: new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-IL', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(
            new Date(`${trend.since}T00:00:00Z`),
          ),
        })
      : interpolate(dict.plan.priceLowestTemplate, { days: trend.days });
  return (
    <p className="text-sm font-semibold text-teal-ink">
      <span aria-hidden="true">↓ </span>
      {text}
    </p>
  );
}

/**
 * The provider's own figure, in the details: labelled as what the card is
 * charged only where that has been confirmed.
 */
function ProviderPrice({ row, locale, dict }: { row: ComparisonRow; locale: Locale; dict: Dictionary }) {
  const { price } = row;
  if (!price.isConverted) return null;
  const confirmed = row.provider.billingCurrency !== 'not-confirmed';
  return (
    <p className="text-sm text-ink-2">
      {interpolate(confirmed ? dict.plan.chargedShortTemplate : dict.plan.listedShortTemplate, {
        provider: row.provider.name,
        // First-strong isolates, so "$27.50" keeps its order inside Hebrew.
        amount: '\u2068' + formatPrice(price.sourceAmountMinor, price.sourceCurrency, locale) + '\u2069',
      })}
      {'. '}
      {dict.plan.chargedExplains}
    </p>
  );
}
