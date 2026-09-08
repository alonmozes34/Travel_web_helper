'use client';

import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { CompareToggle } from './CompareToggle';
import { CouponChip } from './CouponChip';
import { CoverageNote } from './CoverageNote';
import { DataFact, FairUsageNote, NetworkFact, ValidityFact } from './PlanFacts';
import { PlanBadges } from './PlanBadges';
import { PlanCta } from './PlanCta';
import { PlanDetails } from './PlanDetails';
import { PriceBlock } from './PriceBlock';
import { ProviderCell } from './ProviderCell';

/**
 * One result, in both layouts.
 *
 * On a phone it is a card with the facts stacked two-up; from `lg` the same
 * markup becomes a five-column row — `lg:contents` promotes the fact group's
 * children to grid items rather than duplicating the whole plan in the DOM for
 * each breakpoint.
 *
 * Reading order is the hierarchy: provider, data, validity, network, price,
 * action. Everything secondary — price per GB, the source-currency amount,
 * feature tags, the coupon — hangs beneath the column it belongs to instead of
 * claiming a column of its own, which is what keeps the row scannable.
 */
export function PlanListItem({
  row,
  locale,
  dict,
  tripDays,
  countryCodes = [],
  demoDataEnabled,
  isSelected,
  canSelect,
  onSelect,
}: {
  row: ComparisonRow;
  locale: Locale;
  dict: Dictionary;
  tripDays: number;
  countryCodes?: string[];
  demoDataEnabled: boolean;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: (selected: boolean) => void;
}) {
  const isBestValue = row.badges.includes('bestValue');
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <article
      className={cn(
        'relative rounded-lg border border-line bg-surface p-4',
        // Tablet gets its own layout rather than a stretched phone card: the
        // facts spread across three columns and the price moves alongside them.
        'md:grid md:grid-cols-[1.5fr_minmax(11rem,1fr)] md:items-start md:gap-x-6 md:p-5',
        'lg:grid-cols-[1.4fr_0.62fr_0.72fr_0.96fr_1.5fr] lg:items-center lg:gap-x-5',
        'lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-line-soft lg:px-6 lg:py-4',
        isBestValue && 'bg-teal-50/45',
      )}
    >
      {isBestValue ? (
        <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-teal" />
      ) : null}

      <div className="flex items-start gap-3 md:col-start-1 md:row-start-1 lg:col-auto lg:row-auto">
        <div className="min-w-0 flex-1">
          <ProviderCell row={row} />
          <PlanBadges badges={row.badges} dict={dict} />
          <CoverageNote coverage={row.plan.coverage} locale={locale} dict={dict} />
          <FairUsageNote row={row} dict={dict} />
        </div>
      </div>

      <div
        className={cn(
          'mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line-soft py-3',
          'md:col-start-1 md:row-start-2 md:mt-4 md:grid-cols-3',
          'lg:contents',
        )}
      >
        <DataFact row={row} locale={locale} dict={dict} />
        <ValidityFact row={row} dict={dict} tripDays={tripDays} />
        <div className="col-span-2 md:col-span-1 lg:col-span-1">
          <NetworkFact row={row} dict={dict} countryCodes={countryCodes} />
        </div>
      </div>

      <div
        className={cn(
          'mt-3 grid justify-items-start gap-2',
          'md:col-start-2 md:row-start-1 md:row-span-2 md:mt-0 md:justify-items-end md:text-end',
          'lg:col-auto lg:row-auto lg:row-span-1',
        )}
      >
        <PriceBlock row={row} locale={locale} dict={dict} />
        <CouponChip row={row} locale={locale} dict={dict} demoDataEnabled={demoDataEnabled} />
        {row.isBelowEstimatedNeed ? (
          <p className="text-[0.8125rem] text-warn-ink">{dict.plan.belowNeed}</p>
        ) : null}
        <PlanCta
          row={row}
          dict={dict}
          showNote={false}
          detailsOpen={detailsOpen}
          onToggleDetails={() => setDetailsOpen((open) => !open)}
        />
        <CompareToggle
          checked={isSelected}
          disabled={!isSelected && !canSelect}
          onChange={onSelect}
          dict={dict}
        />
      </div>

      {detailsOpen ? (
        <div className="md:col-span-2 lg:col-span-5">
          <PlanDetails row={row} dict={dict} />
        </div>
      ) : null}
    </article>
  );
}
