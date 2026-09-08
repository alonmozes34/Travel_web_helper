'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Dictionary } from '@/i18n/getDictionary';
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
  showNote = true,
}: {
  row: ComparisonRow;
  dict: Dictionary;
  size?: 'sm' | 'md';
  /** The desktop list states this once beneath the rows instead. */
  showNote?: boolean;
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
          {dict.plan.view}
        </Button>
        <Button
          variant="quiet"
          size={size}
          onClick={() => track({ name: 'plan_viewed', planId: row.plan.id, providerId: row.plan.providerId })}
        >
          {dict.plan.details}
        </Button>
      </div>
      {showNote || noted ? (
        <p className="text-[0.7rem] text-ink-3" aria-live="polite">
          {noted ? dict.plan.prototypeLink : dict.plan.buyAtProvider}
        </p>
      ) : null}
    </div>
  );
}
