import type { ReactNode } from 'react';

/**
 * The heading of a section below the comparison: an icon in a tinted square,
 * then the title. The owner found the sections at the foot of the page easy
 * to miss (2 October 2026) — plain headings on plain backgrounds read as one
 * long page of small print.
 */
export function SectionTitle({ id, icon, children }: { id?: string; icon: string; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-head text-2xl font-bold md:text-3xl">
      <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-2xl">
        {icon}
      </span>
      {/* min-w-0 and anywhere: at 200% text on a phone, "destinations" alone is wider than the screen. */}
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </h2>
  );
}
