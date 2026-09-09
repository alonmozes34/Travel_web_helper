'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { track } from '@/lib/analytics/events';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';

/**
 * Primary call to action.
 *
 * Affiliate links are not implemented, so the button cannot navigate anywhere.
 * Rather than pretend, it says so on click — and the standing note below every
 * price already tells the traveller the purchase happens on the provider's own
 * site.
 */
export function PlanCta({
  row,
  dict,
  size = 'sm',
  detailsOpen,
  onToggleDetails,
}: {
  row: ComparisonRow;
  dict: Dictionary;
  size?: 'sm' | 'md';
  /** The desktop list states this once beneath the rows instead. */
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const [noted, setNoted] = useState(false);

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size={size}
          onClick={() => {
            track({
              name: 'provider_clicked',
              planId: row.plan.id,
              providerId: row.plan.providerId,
            });
            setNoted(true);
          }}
        >
          {interpolate(dict.plan.viewAtTemplate, { provider: row.provider.name })}
        </Button>
        <Button
          variant="quiet"
          size={size}
          aria-expanded={detailsOpen}
          onClick={() => {
            if (!detailsOpen) {
              track({ name: 'plan_viewed', planId: row.plan.id, providerId: row.plan.providerId });
            }
            onToggleDetails();
          }}
        >
          {detailsOpen ? dict.details.close : dict.plan.details}
        </Button>
      </div>
      {/* Naming the destination on the button, and saying what happens there,
          is the difference between a link someone follows and a link someone
          is afraid of. Nobody should have to click to find out whether this
          charges them. */}
      <p className="text-sm text-ink-2" aria-live="polite">
        {noted ? dict.plan.prototypeLink : dict.plan.buyAtProvider}
      </p>
    </div>
  );
}
