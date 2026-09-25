import Image from 'next/image';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';

/**
 * Provider identity: their logo where they have issued one to us, otherwise
 * their initial on their brand colour. The name is always written out beside
 * it — the logo is decoration for the eye, the text is what a screen reader
 * and a search read — and the exact plan name is shown so a traveller can
 * find it on the provider's own site.
 */
export function ProviderCell({ row }: { row: ComparisonRow }) {
  const { provider } = row;
  return (
    <div className="flex items-center gap-3">
      {provider.logo ? (
        <span
          aria-hidden="true"
          // Pixels, not rem: a logo is a picture, and sized in text units it
          // doubled with 200% text and pushed a phone screen sideways.
          className="flex h-[40px] w-[84px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-white px-[8px]"
        >
          <Image
            src={provider.logo.src}
            alt=""
            width={provider.logo.width}
            height={provider.logo.height}
            unoptimized
            className="h-auto max-h-[24px] w-auto max-w-full"
          />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-[10px] font-head text-base font-semibold text-white"
          style={{ backgroundColor: provider.brandColor }}
        >
          {provider.name.charAt(0)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-head font-semibold">{provider.name}</span>
        <span className="block truncate text-sm text-ink-3">{row.plan.planName}</span>
      </span>
    </div>
  );
}
