import type { ComparisonRow } from '@/lib/comparison/buildComparison';

/**
 * Provider identity. Until real marks are licensed the tile is the provider's
 * initial on its brand colour; the exact plan name is shown so a traveller can
 * verify it on the provider's own site.
 */
export function ProviderCell({ row }: { row: ComparisonRow }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-[10px] font-head text-base font-semibold text-white"
        style={{ backgroundColor: row.provider.brandColor }}
      >
        {row.provider.name.charAt(0)}
      </span>
      <span className="min-w-0">
        <span className="block font-head font-semibold">{row.provider.name}</span>
        <span className="block truncate text-[0.8125rem] text-ink-3">{row.plan.planName}</span>
      </span>
    </div>
  );
}
