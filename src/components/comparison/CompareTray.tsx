'use client';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';

export const MAX_COMPARE = 3;

/**
 * Sticks to the bottom of the viewport as soon as one plan is selected, so the
 * comparison is always one tap away without covering results the rest of the
 * time.
 */
export function CompareTray({
  selected,
  dict,
  onRemove,
  onClear,
  onCompare,
}: {
  selected: ComparisonRow[];
  dict: Dictionary;
  onRemove: (planId: string) => void;
  onClear: () => void;
  onCompare: () => void;
}) {
  if (selected.length === 0) return null;

  const slots = Array.from({ length: MAX_COMPARE }, (_, index) => selected[index] ?? null);

  return (
    <section
      aria-label={dict.filters.trayLabel}
      className="sticky bottom-0 z-30 border-t border-deep/20 bg-deep text-white"
    >
      <Container className="flex flex-wrap items-center gap-3 py-3">
        {slots.map((row, index) =>
          row ? (
            <span
              key={row.plan.id}
              className="inline-flex items-center gap-2 rounded-sm bg-white/15 px-3 py-1.5 text-sm font-semibold"
            >
              {row.provider.name} · {row.plan.planName}
              <button
                type="button"
                onClick={() => onRemove(row.plan.id)}
                className="inline-flex size-6 items-center justify-center rounded-xs hover:bg-white/20"
              >
                <span aria-hidden="true">✕</span>
                <span className="sr-only">{dict.compare.remove}</span>
              </button>
            </span>
          ) : (
            <span
              key={`slot-${index}`}
              className="rounded-sm border border-dashed border-white/35 px-3 py-1.5 text-sm text-white/70"
            >
              {interpolate(dict.compare.slotTemplate, { index: index + 1 })}
            </span>
          ),
        )}

        <button
          type="button"
          onClick={onClear}
          className="text-sm text-white/70 underline hover:text-white"
        >
          {dict.compare.clear}
        </button>

        <Button size="sm" className="ms-auto" onClick={onCompare} disabled={selected.length < 2}>
          {dict.compare.compare}
        </Button>
      </Container>
    </section>
  );
}
